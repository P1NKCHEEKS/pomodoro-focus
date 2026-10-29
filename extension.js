/**
 * @file Pomodoro Focus — расширение VS Code с таймером по технике Pomodoro.
 * Рабочая сессия 25 минут, перерыв 5 минут. Оставшееся время
 * отображается в строке состояния.
 * @author P1NKCHEEKS
 * @version 1.0.1
 */

const vscode = require('vscode');

/**
 * Длительность рабочей сессии в секундах (25 минут).
 * @constant {number}
 */
const WORK_SECONDS = 25 * 60;

/**
 * Длительность перерыва в секундах (5 минут).
 * @constant {number}
 */
const BREAK_SECONDS = 5 * 60;

/**
 * Сколько секунд осталось до конца текущего интервала.
 * @type {number}
 */
let remaining = WORK_SECONDS;

/**
 * Идентификатор интервала `setInterval`; `undefined`, если таймер остановлен.
 * @type {NodeJS.Timeout | undefined}
 */
let timer;

/**
 * Признак того, что таймер сейчас идёт (не на паузе и не остановлен).
 * @type {boolean}
 */
let running = false;

/**
 * Признак режима перерыва: `true` — перерыв, `false` — рабочая сессия.
 * @type {boolean}
 */
let onBreak = false;

/**
 * Элемент строки состояния, в котором показывается таймер.
 * @type {vscode.StatusBarItem | undefined}
 */
let statusBar;

/**
 * Точка входа расширения. Вызывается VS Code при активации.
 * Создаёт элемент строки состояния и регистрирует команды
 * `pomodoro.start`, `pomodoro.pause`, `pomodoro.break` и `pomodoro.reset`.
 *
 * @param {vscode.ExtensionContext} context - Контекст расширения, в который
 *   добавляются ресурсы для автоматического освобождения при деактивации.
 * @returns {void}
 */
function activate(context) {
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.command = 'pomodoro.start';
    context.subscriptions.push(statusBar);
    updateStatus();

    context.subscriptions.push(
        vscode.commands.registerCommand('pomodoro.start', startTimer),
        vscode.commands.registerCommand('pomodoro.pause', togglePause),
        vscode.commands.registerCommand('pomodoro.break', startBreak),
        vscode.commands.registerCommand('pomodoro.reset', resetTimer)
    );
}

/**
 * Запускает обратный отсчёт с текущего значения {@link remaining}.
 * Если таймер уже идёт, показывает уведомление и ничего не меняет.
 * По достижении нуля останавливает таймер и сообщает об окончании
 * рабочей сессии или перерыва.
 *
 * Команда: `pomodoro.start`.
 *
 * @returns {void}
 */
function startTimer() {
    if (running) {
        vscode.window.showInformationMessage('Pomodoro timer is already running.');
        return;
    }
    running = true;
    updateStatus();
    timer = setInterval(() => {
        remaining--;
        updateStatus();
        if (remaining <= 0) {
            clearInterval(timer);
            timer = undefined;
            running = false;
            vscode.window.showInformationMessage(
                onBreak ? 'Break finished! Ready to focus?' : 'Focus session finished! Time for a break.'
            );
            updateStatus();
        }
    }, 1000);
}

/**
 * Ставит таймер на паузу, если он идёт, и возобновляет, если он остановлен.
 * Оставшееся время при паузе сохраняется.
 *
 * Команда: `pomodoro.pause`.
 *
 * @returns {void}
 */
function togglePause() {
    if (running) {
        clearInterval(timer);
        timer = undefined;
        running = false;
        updateStatus();
    } else {
        startTimer();
    }
}

/**
 * Прерывает текущий отсчёт и сразу запускает 5-минутный перерыв.
 *
 * Команда: `pomodoro.break`.
 *
 * @returns {void}
 */
function startBreak() {
    clearInterval(timer);
    timer = undefined;
    running = false;
    onBreak = true;
    remaining = BREAK_SECONDS;
    startTimer();
}

/**
 * Останавливает таймер и возвращает его в исходное состояние:
 * режим фокуса, 25:00. Показывает уведомление о сбросе.
 *
 * Команда: `pomodoro.reset`.
 *
 * @returns {void}
 */
function resetTimer() {
    clearInterval(timer);
    timer = undefined;
    running = false;
    onBreak = false;
    remaining = WORK_SECONDS;
    updateStatus();
    vscode.window.showInformationMessage('Pomodoro timer reset.');
}

/**
 * Обновляет текст и подсказку элемента строки состояния.
 * Формат текста: `<режим> ММ:СС`, плюс значок ⏸, если таймер не идёт.
 * Ничего не делает, если элемент ещё не создан.
 *
 * @returns {void}
 */
function updateStatus() {
    if (!statusBar) return;
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    statusBar.text = `${onBreak ? '☕ Break' : '🍅 Focus'} ${minutes}:${seconds}${running ? '' : ' ⏸'}`;
    statusBar.tooltip = 'Pomodoro Focus — use the Command Palette to control the timer';
    statusBar.show();
}

/**
 * Вызывается VS Code при деактивации расширения.
 * Останавливает активный интервал, если он есть.
 *
 * @returns {void}
 */
function deactivate() {
    if (timer) clearInterval(timer);
}

module.exports = { activate, deactivate };