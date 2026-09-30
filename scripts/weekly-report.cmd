@echo off
REM Weekly report. Runs Monday 09:00 via Task Scheduler.
REM ASCII only - Korean breaks under cp949 in cmd files.
cd /d "%~dp0.."
echo ===== %DATE% %TIME% ===== >> "%~dp0weekly-report.log"
call npm run seo -- --track >> "%~dp0weekly-report.log" 2>&1
call npm run stats >> "%~dp0weekly-report.log" 2>&1
call npm run report -- --json >> "%~dp0weekly-report.log" 2>&1
