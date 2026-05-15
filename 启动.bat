@echo off
title Markdown to WeChat
echo Starting Markdown to WeChat...
echo.
python -m http.server 5173 -d "%~dp0docs"
start http://127.0.0.1:5173/
pause
