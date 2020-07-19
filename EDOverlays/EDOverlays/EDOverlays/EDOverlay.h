// CEDOverlay.h : Declaration of the CEDOverlay

#pragma once
#include "resource.h"       // main symbols
#include "EDOverlays_i.h"

// You can put these includes in "stdafx.h" if you want
#include <shlobj.h>
#include <comdef.h>


#if defined(_WIN32_WCE) && !defined(_CE_DCOM) && !defined(_CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA)
#error "Single-threaded COM objects are not properly supported on Windows CE platform, such as the Windows Mobile platforms that do not include full DCOM support. Define _CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA to force ATL to support creating single-thread COM object's and allow use of it's single-threaded COM object implementations. The threading model in your rgs file was set to 'Free' as that is the only threading model supported in non DCOM Windows CE platforms."
#endif

using namespace ATL;


// CEDOverlay

class ATL_NO_VTABLE CEDOverlay :
	public CComObjectRootEx<CComSingleThreadModel>,
	public CComCoClass<CEDOverlay, &CLSID_EDOverlay>,
	public IShellIconOverlayIdentifier,
	public IDispatchImpl<IEDOverlay, &IID_IEDOverlay, &LIBID_EDOverlaysLib, /*wMajor =*/ 1, /*wMinor =*/ 0>
{
public:
	CEDOverlay(int state);

	IFACEMETHODIMP_(ULONG) AddRef();
	IFACEMETHODIMP GetOverlayInfo(PWSTR pwszIconFile, int cchMax, int* pIndex, DWORD* pdwFlags);
	IFACEMETHODIMP GetPriority(int* pPriority);
	IFACEMETHODIMP IsMemberOf(PCWSTR pwszPath, DWORD dwAttrib);
	IFACEMETHODIMP QueryInterface(REFIID riid, void** ppv);
	IFACEMETHODIMP_(ULONG) Release();

DECLARE_REGISTRY_RESOURCEID(106)


BEGIN_COM_MAP(CEDOverlay)
	COM_INTERFACE_ENTRY(IEDOverlay)
	COM_INTERFACE_ENTRY(IDispatch)
	COM_INTERFACE_ENTRY(IShellIconOverlayIdentifier)
END_COM_MAP()



	DECLARE_PROTECT_FINAL_CONSTRUCT()

	HRESULT FinalConstruct()
	{
		return S_OK;
	}

	void FinalRelease()
	{
	}

protected:
	~CEDOverlay();

private:
	long _referenceCount;
	int _state;


};

OBJECT_ENTRY_AUTO(__uuidof(EDOverlay), CEDOverlay)
