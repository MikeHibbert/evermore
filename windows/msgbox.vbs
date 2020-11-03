Function BrowseForFile( dialogText )
  Set oShell = CreateObject("WScript.Shell")
  strHomeFolder = oShell.SpecialFolders.Item("MyDocuments") 
  sFilter = "json files (*.json)|" 

  file = GetFileDlgEx(Replace(strHomeFolder,"\","\\"),sFilter,dialogText) 

  BrowseForFile = Replace(file, "\r\n", "")
End Function

Function GetFileDlgEx(sIniDir, sFilter, sTitle) 
  Set oDlg = CreateObject("WScript.Shell").Exec("mshta.exe ""about:<object id=d classid=clsid:3050f4e1-98b5-11cf-bb82-00aa00bdce0b></object><script>moveTo(0,-9999);eval(new ActiveXObject('Scripting.FileSystemObject').GetStandardStream(0).Read("&Len(sIniDir)+Len(sFilter)+Len(sTitle)+41&"));function window.onload(){var p=/[^\0]*/;new ActiveXObject('Scripting.FileSystemObject').GetStandardStream(1).Write(p.exec(d.object.openfiledlg(iniDir,null,filter,title)));close();}</script><hta:application showintaskbar=no />""") 
  oDlg.StdIn.Write "var iniDir='" & sIniDir & "';var filter='" & sFilter & "';var title='" & sTitle & "';" 
  GetFileDlgEx = oDlg.StdOut.ReadAll 
End Function

Function BrowseForFolder( dialogText )
  Dim shell : Set shell = CreateObject("Shell.Application")
  Dim file : Set file = shell.BrowseForFolder(0, dialogTitle, &H4000)
  BrowseForFolder = Replace(file.self.Path, "\r\n", "")
End Function


Set objArgs = WScript.Arguments
dialogType = objArgs(0)
dialogTitle = objArgs(1)
dialogText = objArgs(2)

If dialogType = "notification" Then
  MsgBox dialogText, 0, dialogTitle
ElseIf dialogType = "question" Then
  answer = MsgBox( dialogText, vbOKCancel, dialogTitle )
  Wscript.Stdout.Write answer
ElseIf dialogType = "entry" Then
  entryText = InputBox( dialogText, dialogTitle )
  Wscript.Stdout.Write entryText
ElseIf dialogType = "fileselect" Then
  fileName =  BrowseForFile(dialogTitle)
  WScript.echo fileName
ElseIf dialogType = "folderselect" Then
  fileName =  BrowseForFolder(dialogTitle)
  WScript.echo fileName
Else
  WScript.Echo "unknown dialog type"
End If
