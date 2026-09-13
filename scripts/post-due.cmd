@echo off
REM 예약 시각이 된 글을 올린다. 30분마다 돌린다.
REM 스레드: 시각이 된 것 하나 / 인스타: 하루 한 건 (자체 문지기)
REM 올릴 게 없으면 아무 일도 하지 않고 끝난다.
cd /d "%~dp0.."
call npm run social:post -- --due --publish >> "%~dp0post-due.log" 2>&1
call npm run ig:post -- --due --publish >> "%~dp0post-due.log" 2>&1
