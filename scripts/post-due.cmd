@echo off
REM Post whatever is due. Runs every 30 minutes via Task Scheduler.
REM Threads: one due entry per run. Instagram: one per day (self-gated).
REM ASCII only - see post-due.vbs for why this file must not hold Korean.
cd /d "%~dp0.."
call npm run social:post -- --due --publish >> "%~dp0post-due.log" 2>&1
call npm run ig:post -- --due --publish >> "%~dp0post-due.log" 2>&1
