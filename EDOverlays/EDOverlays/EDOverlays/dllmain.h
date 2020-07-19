// dllmain.h : Declaration of module class.

class CEDOverlaysModule : public ATL::CAtlDllModuleT< CEDOverlaysModule >
{
public :
	DECLARE_LIBID(LIBID_EDOverlaysLib)
	DECLARE_REGISTRY_APPID_RESOURCEID(IDR_EDOVERLAYS, "{4e4b1625-1f60-47d0-8286-e090cea07f2f}")
};

extern class CEDOverlaysModule _AtlModule;
