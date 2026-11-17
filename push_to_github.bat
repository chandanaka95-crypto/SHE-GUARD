@echo off
echo ========================================================
echo   SHEGUARD - Pushing Repository to GitHub
echo   Target: https://github.com/chandanaka95-crypto/SHE-GUARD.git
echo ========================================================
set "PATH=%PATH%;C:\Users\OM\AppData\Local\Programs\MinGit\cmd"

echo.
echo Running git push -u origin main...
echo (A GitHub login window or prompt will appear if not signed in)
echo.

git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ----------------------------------------------------
    echo If authentication failed, you can push with a GitHub
    echo Personal Access Token using:
    echo git push https://YOUR_TOKEN@github.com/chandanaka95-crypto/SHE-GUARD.git main
    echo ----------------------------------------------------
) else (
    echo.
    echo Successfully pushed to https://github.com/chandanaka95-crypto/SHE-GUARD.git!
)

pause
