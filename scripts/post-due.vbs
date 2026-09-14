' Launch post-due.cmd with no console window.
' Task Scheduler runs this via wscript.exe so nothing flashes on screen.
Dim sh, here
Set sh = CreateObject("WScript.Shell")
here = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, chr(92)))
sh.Run """" & here & "post-due.cmd""", 0, False
