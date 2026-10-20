/**
 * Spelling Dive → Google Sheet.
 * Paste into Extensions → Apps Script of your own spreadsheet and deploy as a web app
 * (Execute as: Me, Who has access: Anyone). The game only appends rows; it cannot read the sheet.
 */

const LOG = 'Log';
const SUMMARY = 'Сводка';
const HEADERS = ['Время', 'День', 'Тип', 'Слово', 'Верно', 'Голосом', 'Режим', 'Миссия', 'Минут за день', 'Детали', 'Устройство'];
const TYPES = ['answer', 'creature', 'test', 'day', 'ping'];

function doGet() {
  return ContentService.createTextOutput('Spelling Dive: связь работает.');
}

function doPost(e) {
  if (!e || !e.postData || e.postData.length > 300000) return text('too big');
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return text('bad json');
  }
  const events = Array.isArray(body.events) ? body.events.slice(0, 500) : [];
  const rows = events
    .filter((ev) => ev && TYPES.indexOf(ev.type) !== -1)
    .map((ev) => [
      new Date(Number(ev.at) || Date.now()),
      clean(ev.day),
      ev.type,
      clean(ev.word),
      ev.ok === true ? true : ev.ok === false ? false : '',
      ev.voice === true,
      clean(ev.mode),
      clean(ev.mission),
      typeof ev.minutes === 'number' && isFinite(ev.minutes) ? ev.minutes : '',
      clean(ev.detail),
      clean(body.device),
    ]);
  if (!rows.length) return text('ok');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const log = ensureSheets(SpreadsheetApp.getActiveSpreadsheet());
    log.getRange(log.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  } finally {
    lock.releaseLock();
  }
  return text('ok');
}

/** Optional: run once from the editor to create the sheets before the first game event. */
function setup() {
  ensureSheets(SpreadsheetApp.getActiveSpreadsheet());
}

function text(s) {
  return ContentService.createTextOutput(s);
}

/** Short plain text only; a leading = + - @ would turn it into a formula. */
function clean(v) {
  const s = String(v == null ? '' : v).slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function ensureSheets(ss) {
  let log = ss.getSheetByName(LOG);
  if (!log) {
    log = ss.insertSheet(LOG);
    log.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    log.setFrozenRows(1);
    log.getRange('A:A').setNumberFormat('dd.mm.yyyy hh:mm');
    log.getRange('B:B').setNumberFormat('@');
  }
  if (!ss.getSheetByName(SUMMARY)) buildSummary(ss);
  return log;
}

function buildSummary(ss) {
  const s = ss.insertSheet(SUMMARY, 0);
  const today = 'TEXT(TODAY(),"yyyy-mm-dd")';
  s.getRange('A1').setValue('Spelling Dive — статистика').setFontSize(16).setFontWeight('bold');
  s.getRange('A2').setValue('Обновляется сама после каждого ответа. Все события — на листе Log.').setFontColor('#666666');

  const rows = [
    ['Выучено слов (из 40)', '=IFERROR(COUNTUNIQUE(FILTER(Log!D2:D, Log!C2:C="answer", Log!E2:E=TRUE, Log!G2:G="dive")), 0)'],
    ['Существ открыто (из 10)', '=IFERROR(COUNTUNIQUE(FILTER(Log!D2:D, Log!C2:C="creature")), 0)'],
    ['Последнее занятие', '=IFERROR(TEXT(MAX(FILTER(Log!A2:A, Log!C2:C="answer")), "d mmm, hh:mm"), "—")'],
    ['Минут сегодня', '=IFERROR(MAX(FILTER(Log!I2:I, Log!B2:B=' + today + ')), 0)'],
    ['Минут за 7 дней', '=IFERROR(SUM(QUERY(Log!B2:I, "select max(I) where B >= \'"&TEXT(TODAY()-6,"yyyy-mm-dd")&"\' and I is not null group by B label max(I) \'\'", 0)), 0)'],
    ['Дней с занятиями за 14 дней', '=IFERROR(COUNTUNIQUE(FILTER(Log!B2:B, Log!C2:C="answer", Log!B2:B>=TEXT(TODAY()-13,"yyyy-mm-dd"))), 0)'],
    ['Ответов всего', '=COUNTIF(Log!C2:C, "answer")'],
    ['Ошибок всего', '=COUNTIFS(Log!C2:C, "answer", Log!E2:E, FALSE)'],
  ];
  rows.forEach((r, i) => {
    s.getRange(4 + i, 1).setValue(r[0]);
    s.getRange(4 + i, 2).setFormula(r[1]).setFontWeight('bold').setHorizontalAlignment('right');
  });

  const blocks = [
    [13, 'Минуты по дням',
      '=IFERROR(QUERY(Log!A2:K, "select B, max(I) where I is not null group by B order by B desc limit 14 label B \'День\', max(I) \'Минут\'", 0), "пока нет данных")'],
    [31, 'Где чаще ошибается',
      '=IFERROR(QUERY(Log!A2:K, "select D, count(D) where C = \'answer\' and E = false group by D order by count(D) desc limit 10 label D \'Слово\', count(D) \'Ошибок\'", 0), "ошибок нет")'],
    [45, 'Bee Test (пробный экзамен)',
      '=IFERROR(QUERY(Log!A2:K, "select B, J where C = \'test\' order by A desc limit 10 label B \'День\', J \'Результат\'", 0), "ещё не проходил")'],
    [59, 'Выученные слова',
      '=IFERROR(QUERY(Log!A2:K, "select D, min(B) where C = \'answer\' and E = true and G = \'dive\' group by D order by min(B) label D \'Слово\', min(B) \'Когда\'", 0), "пока нет")'],
  ];
  blocks.forEach((b) => {
    s.getRange(b[0], 1).setValue(b[1]).setFontWeight('bold').setFontSize(12);
    s.getRange(b[0] + 1, 1).setFormula(b[2]);
  });

  s.setColumnWidth(1, 230);
  s.setColumnWidth(2, 130);
  s.setFrozenRows(0);
}
