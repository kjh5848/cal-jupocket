@echo off
REM 예약 시각이 된 스레드 글 하나를 올린다. 30분마다 돌린다.
REM 올릴 게 없으면 아무 일도 하지 않고 끝난다(정상 종료).
cd /d "%~dp0.."
call npm run social:post -- --due --publish >> "%~dp0post-due.log" 2>&1
