@echo off
title Pró Guns Armeria - Sistema de Gestão
echo ========================================================
echo       INICIANDO SISTEMA PRO GUNS ARMERIA
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Iniciando Servidor Local (SQLite / Sincronizacao)...
start "Servidor Local - Armeria" cmd /c "node local-server/server.js"

echo [2/3] Iniciando Aplicacao Web (Frontend)...
start "Frontend - Armeria" cmd /c "npm run dev"

echo [3/3] Aguardando inicializacao dos servicos...
timeout /t 3 /nobreak >nul

echo Abrindo navegador...
start http://localhost:5173

echo.
echo ========================================================
echo       SISTEMA INICIADO COM SUCESSO!
echo    Voce pode minimizar esta janela. 
echo    Para fechar o sistema, encerre as janelas abertas.
echo ========================================================
pause
