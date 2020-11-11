
Set-ExecutionPolicy RemoteSigned
npx nodegui-packer --pack ./dist
Write-Host "============================"
Write-Host "WINDOWS EXE BUILT"
Write-Host "============================"
Copy-Item windows\bin\EMDContextMenu.dll deploy\win32\build\Evermore
Copy-Item windows\bin\EMDOverlays.dll deploy\win32\build\Evermore
Write-Host "============================"
Write-Host "COPIED OVERLAY SUPPORT FILES"
Write-Host "============================"


Write-Host "=========================="
Write-Host "DONE!"
Write-Host "============================"