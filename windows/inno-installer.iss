; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "Evermore"
#define MyAppVersion "0.9.2"
#define MyAppPublisher "Hibbert IT Solutions Limited"
#define MyAppURL "https://evermoredata.store"
#define MyAppExeName "qode.exe"
#define OutputBaseFilename "evermore_setup-0.9.2"
#define MyAppId "{F464BC3D-46C2-4453-B99B-24EDF4741EAF}"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=admin
OutputDir=C:\Users\hibbe\Desktop
OutputBaseFilename={#OutputBaseFilename}
SetupIconFile=C:\Users\hibbe\Documents\Nodejs\Evermore\windows\evermore-installer.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
AlwaysRestart=yes 
SignTool=signtool
SignedUninstaller=yes
UninstallDisplayName={#MyAppName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "C:\Users\hibbe\Documents\Nodejs\Evermore\deploy\win32\build\Evermore\qode.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\hibbe\Documents\Nodejs\Evermore\deploy\win32\build\Evermore\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\hibbe\Documents\Nodejs\Evermore\deploy\win32\build\Evermore\EMDContextMenu.dll"; DestDir: "{app}"; Flags: regserver sharedfile ignoreversion
Source: "C:\Users\hibbe\Documents\Nodejs\Evermore\deploy\win32\build\Evermore\EMDOverlays.dll"; DestDir: "{app}"; Flags: regserver sharedfile ignoreversion
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autostartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{autostartmenu}\Programs\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; AppUserModelID: "com.evermore.desktopclient"

 
[Code]
const
  NET_FW_SCOPE_ALL = 0;
  NET_FW_IP_VERSION_ANY = 2;

{ Cannot use built-in DeleteFile directly in AfterInstall as it's a function,
{ not a procedure. And this way we can add some error handling too. }
procedure DoDeleteFile(FileName: string);
begin
  if DeleteFile(FileName) then
  begin
    Log(Format('"%s" deleted', [FileName]));
  end
    else
  begin
    MsgBox(Format('Failed to delete "%s"', [FileName]), mbError, MB_OK);
  end;
end;

// function IsModuleLoaded to call at install time
// added also setuponly flag
function IsModuleLoaded(modulename: String ):  Boolean;  
var
    FSWbemLocator: Variant;
    FWMIService   : Variant;
    FWbemObjectSet: Variant;
begin
    Result := false;
    FSWbemLocator := CreateOleObject('WBEMScripting.SWBEMLocator');
    FWMIService := FSWbemLocator.ConnectServer('', 'root\CIMV2', '', '');
    FWbemObjectSet :=
      FWMIService.ExecQuery(
        Format('SELECT Name FROM Win32_Process Where Name="%s"', [modulename]));
    Result := (FWbemObjectSet.Count > 0);
    FWbemObjectSet := Unassigned;
    FWMIService := Unassigned;
    FSWbemLocator := Unassigned;
end;
 
// function IsModuleLoadedU to call at uninstall time
// added also uninstallonly flag
function IsModuleLoadedU(modulename: String ):  Boolean;
var
    FSWbemLocator: Variant;
    FWMIService   : Variant;
    FWbemObjectSet: Variant;
begin
    Result := false;
    FSWbemLocator := CreateOleObject('WBEMScripting.SWBEMLocator');
    FWMIService := FSWbemLocator.ConnectServer('', 'root\CIMV2', '', '');
    FWbemObjectSet :=
      FWMIService.ExecQuery(
        Format('SELECT Name FROM Win32_Process Where Name="%s"', [modulename]));
    Result := (FWbemObjectSet.Count > 0);
    FWbemObjectSet := Unassigned;
    FWMIService := Unassigned;
    FSWbemLocator := Unassigned;
end;
 
function Count(What, Where: String): Integer;
begin
   Result := 0;
    if Length(What) = 0 then
        exit;
    while Pos(What,Where)>0 do
    begin
        Where := Copy(Where,Pos(What,Where)+Length(What),Length(Where));
        Result := Result + 1;
    end;
end;
 
 
//split text to array
procedure Explode(var ADest: TArrayOfString; aText, aSeparator: String);
var tmp: Integer;
begin
    if aSeparator='' then
        exit;
 
    SetArrayLength(ADest,Count(aSeparator,aText)+1)
 
    tmp := 0;
    repeat
        if Pos(aSeparator,aText)>0 then
        begin
 
            ADest[tmp] := Copy(aText,1,Pos(aSeparator,aText)-1);
            aText := Copy(aText,Pos(aSeparator,aText)+Length(aSeparator),Length(aText));
            tmp := tmp + 1;
 
        end else
        begin
 
             ADest[tmp] := aText;
             aText := '';
 
        end;
    until Length(aText)=0;
end;
 
 
//compares two version numbers, returns -1 if vA is newer, 0 if both are identical, 1 if vB is newer
function CompareVersion(vA,vB: String): Integer;
var tmp: TArrayOfString;
    verA,verB: Array of Integer;
    i,len: Integer;
begin
 
    StringChange(vA,'-','.');
    StringChange(vB,'-','.');
 
    Explode(tmp,vA,'.');
    SetArrayLength(verA,GetArrayLength(tmp));
    for i := 0 to GetArrayLength(tmp) - 1 do
        verA[i] := StrToIntDef(tmp[i],0);
        
    Explode(tmp,vB,'.');
    SetArrayLength(verB,GetArrayLength(tmp));
    for i := 0 to GetArrayLength(tmp) - 1 do
        verB[i] := StrToIntDef(tmp[i],0);
 
    len := GetArrayLength(verA);
    if GetArrayLength(verB) < len then
        len := GetArrayLength(verB);
 
    for i := 0 to len - 1 do
        if verA[i] < verB[i] then
        begin
            Result := 1;
            exit;
        end else
        if verA[i] > verB[i] then
        begin
            Result := -1;
            exit
        end;
 
    if GetArrayLength(verA) < GetArrayLength(verB) then
    begin
        Result := 1;
        exit;
    end else
    if GetArrayLength(verA) > GetArrayLength(verB) then
    begin
        Result := -1;
        exit;
    end;
 
    Result := 0; 
end;
 
function InitializeSetup(): Boolean;
var
  oldVersion: String;
  uninstaller: String;
  ErrorCode: Integer;
begin
  if IsModuleLoaded( 'qode.exe' ) then
  begin
    MsgBox( 'Evermore is running, please close it and run setup again.',
             mbError, MB_OK );
    Result := False;
    Exit;
  end;
 
  if RegKeyExists(HKEY_LOCAL_MACHINE,
    'SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppID}_is1') then
  begin
    RegQueryStringValue(HKEY_LOCAL_MACHINE,
      'SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppID}_is1',
      'DisplayVersion', oldVersion);
    if (CompareVersion(oldVersion, '{#MyAppVersion}') < 0) then
    begin
      if MsgBox('Version ' + oldVersion + ' of Evermore is already installed. Continue to use this old version?',
        mbConfirmation, MB_YESNO) = IDYES then
      begin
        Result := False;
      end
      else
      begin
          RegQueryStringValue(HKEY_LOCAL_MACHINE,
            'SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppID}_is1',
            'UninstallString', uninstaller);
          ShellExec('runas', uninstaller, '/SILENT', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
          if (ErrorCode <> 0) then
          begin
            MsgBox( 'Failed to uninstall Evermore version ' + oldVersion + '. Please restart Windows and run setup again.',
             mbError, MB_OK );
            Result := False;
          end
          else
          begin
            Result := True;
          end;
      end;
    end
    else
    begin
      MsgBox('Version ' + oldVersion + ' of Evermore is already installed. This installer will exit.',
        mbInformation, MB_OK);
      Result := False;
    end;
  end
  else
  begin
    Result := True;
  end;
end;

function GetModuleHandle(moduleName: String): LongWord;
external 'GetModuleHandleW@kernel32.dll stdcall';

function FreeLibrary(module: LongWord): Integer;
external 'FreeLibrary@kernel32.dll stdcall';

procedure freeDLL(DllPath:string);
    var
    lib: LongWord; 
    res: integer;
begin
  repeat
    lib := GetModuleHandle(DllPath);
    res := FreeLibrary(lib);
  until res = 0;
end; 
 
function InitializeUninstall(): Boolean;
begin
 
  // check if notepad is running
  if IsModuleLoadedU( 'qode.exe' ) then
  begin
    MsgBox( 'Evermore is running, please close it and run again uninstall.',
             mbError, MB_OK );
    Result := false;
  end
  else Result := true;

  // Unload the DLL, otherwise the dll psvince is not deleted
  freeDLL(ExpandConstant('{app}\EMDContextMenu.dll'));
  freeDLL(ExpandConstant('{app}\EMDOverlays.dll'));
 
end;

procedure SetFirewallException(AppName,FileName:string);
var
  FirewallObject: Variant;
  FirewallManager: Variant;
  FirewallProfile: Variant;
begin
  try
    FirewallObject := CreateOleObject('HNetCfg.FwAuthorizedApplication');
    FirewallObject.ProcessImageFileName := FileName;
    FirewallObject.Name := AppName;
    FirewallObject.Scope := NET_FW_SCOPE_ALL;
    FirewallObject.IpVersion := NET_FW_IP_VERSION_ANY;
    FirewallObject.Enabled := True;
    FirewallManager := CreateOleObject('HNetCfg.FwMgr');
    FirewallProfile := FirewallManager.LocalPolicy.CurrentProfile;
    FirewallProfile.AuthorizedApplications.Add(FirewallObject);
  except
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
  FirewallManager: Variant;
  FirewallProfile: Variant;
  FirewallObject: Variant;
begin
  if CurStep = ssPostInstall then
    try
      //FirewallManager := CreateOleObject('HNetCfg.FwMgr');
      //FirewallProfile := FirewallManager.LocalPolicy.CurrentProfile;
      //FirewallObject := CreateOleObject('HNetCfg.FwAuthorizedApplication');
      //FirewallObject.Name := '{#MyAppName}';
      //FirewallObject.ProcessImageFileName := ExpandConstant('{app}\qode.exe');
      //FirewallProfile.AuthorizedApplications.Add(FirewallObject);
      SetFirewallException('{#MyAppName}', ExpandConstant('{app}\qode.exe')); 
    except
    end;
end;



procedure RemoveFirewallException( FileName:string );
var
  FirewallManager: Variant;
  FirewallProfile: Variant;
begin
  try
    FirewallManager := CreateOleObject('HNetCfg.FwMgr');
    FirewallProfile := FirewallManager.LocalPolicy.CurrentProfile;
    FireWallProfile.AuthorizedApplications.Remove(FileName);
  except
  end;
end;

procedure CurUninstallStepChanged (CurUninstallStep: TUninstallStep);
 var
    ResultCode: Integer;
    FirewallManager: Variant;
    FirewallProfile: Variant;
    FirewallObject: Variant;
 begin
    if CurUninstallStep = usUninstall then
      begin
        Exec('regsvr32', ExpandConstant('/u /s "{app}\EMDContextMenu.dll"'), '', 0, ewWaitUntilTerminated, ResultCode);
        Exec('regsvr32', ExpandConstant('/u /s "{app}\EMDOverlays.dll"'), '', 0, ewWaitUntilTerminated, ResultCode);
        //FirewallManager := CreateOleObject('HNetCfg.FwMgr');
        //FirewallProfile := FirewallManager.LocalPolicy.CurrentProfile;
        //FireWallProfile.AuthorizedApplications.Remove(ExpandConstant('{app}\qode.exe'));
        RemoveFirewallException(ExpandConstant('{app}\qode.exe'));
      end;
    if CurUninstallStep = usPostUninstall then
      begin
        //DoDeleteFile('{app}\EMDContextMenu.dll');
        //DoDeleteFile('{app}\EMDOverlays.dll');
        DelTree(ExpandConstant('{userappdata}\Evermore'), True, True, True);
        DelTree(ExpandConstant('{app}'), True, True, True);
      end;
  
end;  

function UninstallNeedRestart(): Boolean;
begin
  // DoDeleteFile('{app}\EMDContextMenu.dll');
  // DoDeleteFile('{app}\EMDOverlays.dll');
  // DelTree(ExpandConstant('{app}'), True, True, True);
  Result := true;
end;