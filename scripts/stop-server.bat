@echo off
title ORÉE - Arrêt du serveur
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-server.ps1"
