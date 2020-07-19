

/* this ALWAYS GENERATED file contains the definitions for the interfaces */


 /* File created by MIDL compiler version 8.01.0622 */
/* at Tue Jan 19 03:14:07 2038
 */
/* Compiler settings for EDOverlays.idl:
    Oicf, W1, Zp8, env=Win32 (32b run), target_arch=X86 8.01.0622 
    protocol : dce , ms_ext, c_ext, robust
    error checks: allocation ref bounds_check enum stub_data 
    VC __declspec() decoration level: 
         __declspec(uuid()), __declspec(selectany), __declspec(novtable)
         DECLSPEC_UUID(), MIDL_INTERFACE()
*/
/* @@MIDL_FILE_HEADING(  ) */



/* verify that the <rpcndr.h> version is high enough to compile this file*/
#ifndef __REQUIRED_RPCNDR_H_VERSION__
#define __REQUIRED_RPCNDR_H_VERSION__ 500
#endif

#include "rpc.h"
#include "rpcndr.h"

#ifndef __RPCNDR_H_VERSION__
#error this stub requires an updated version of <rpcndr.h>
#endif /* __RPCNDR_H_VERSION__ */

#ifndef COM_NO_WINDOWS_H
#include "windows.h"
#include "ole2.h"
#endif /*COM_NO_WINDOWS_H*/

#ifndef __EDOverlays_i_h__
#define __EDOverlays_i_h__

#if defined(_MSC_VER) && (_MSC_VER >= 1020)
#pragma once
#endif

/* Forward Declarations */ 

#ifndef __IEDOverlay_FWD_DEFINED__
#define __IEDOverlay_FWD_DEFINED__
typedef interface IEDOverlay IEDOverlay;

#endif 	/* __IEDOverlay_FWD_DEFINED__ */


#ifndef __EDOverlay_FWD_DEFINED__
#define __EDOverlay_FWD_DEFINED__

#ifdef __cplusplus
typedef class EDOverlay EDOverlay;
#else
typedef struct EDOverlay EDOverlay;
#endif /* __cplusplus */

#endif 	/* __EDOverlay_FWD_DEFINED__ */


/* header files for imported files */
#include "oaidl.h"
#include "ocidl.h"
#include "shobjidl.h"

#ifdef __cplusplus
extern "C"{
#endif 


#ifndef __IEDOverlay_INTERFACE_DEFINED__
#define __IEDOverlay_INTERFACE_DEFINED__

/* interface IEDOverlay */
/* [unique][nonextensible][dual][uuid][object] */ 


EXTERN_C const IID IID_IEDOverlay;

#if defined(__cplusplus) && !defined(CINTERFACE)
    
    MIDL_INTERFACE("33e9cd6c-07a1-48d3-8d91-7b753c30e67d")
    IEDOverlay : public IDispatch
    {
    public:
    };
    
    
#else 	/* C style interface */

    typedef struct IEDOverlayVtbl
    {
        BEGIN_INTERFACE
        
        HRESULT ( STDMETHODCALLTYPE *QueryInterface )( 
            IEDOverlay * This,
            /* [in] */ REFIID riid,
            /* [annotation][iid_is][out] */ 
            _COM_Outptr_  void **ppvObject);
        
        ULONG ( STDMETHODCALLTYPE *AddRef )( 
            IEDOverlay * This);
        
        ULONG ( STDMETHODCALLTYPE *Release )( 
            IEDOverlay * This);
        
        HRESULT ( STDMETHODCALLTYPE *GetTypeInfoCount )( 
            IEDOverlay * This,
            /* [out] */ UINT *pctinfo);
        
        HRESULT ( STDMETHODCALLTYPE *GetTypeInfo )( 
            IEDOverlay * This,
            /* [in] */ UINT iTInfo,
            /* [in] */ LCID lcid,
            /* [out] */ ITypeInfo **ppTInfo);
        
        HRESULT ( STDMETHODCALLTYPE *GetIDsOfNames )( 
            IEDOverlay * This,
            /* [in] */ REFIID riid,
            /* [size_is][in] */ LPOLESTR *rgszNames,
            /* [range][in] */ UINT cNames,
            /* [in] */ LCID lcid,
            /* [size_is][out] */ DISPID *rgDispId);
        
        /* [local] */ HRESULT ( STDMETHODCALLTYPE *Invoke )( 
            IEDOverlay * This,
            /* [annotation][in] */ 
            _In_  DISPID dispIdMember,
            /* [annotation][in] */ 
            _In_  REFIID riid,
            /* [annotation][in] */ 
            _In_  LCID lcid,
            /* [annotation][in] */ 
            _In_  WORD wFlags,
            /* [annotation][out][in] */ 
            _In_  DISPPARAMS *pDispParams,
            /* [annotation][out] */ 
            _Out_opt_  VARIANT *pVarResult,
            /* [annotation][out] */ 
            _Out_opt_  EXCEPINFO *pExcepInfo,
            /* [annotation][out] */ 
            _Out_opt_  UINT *puArgErr);
        
        END_INTERFACE
    } IEDOverlayVtbl;

    interface IEDOverlay
    {
        CONST_VTBL struct IEDOverlayVtbl *lpVtbl;
    };

    

#ifdef COBJMACROS


#define IEDOverlay_QueryInterface(This,riid,ppvObject)	\
    ( (This)->lpVtbl -> QueryInterface(This,riid,ppvObject) ) 

#define IEDOverlay_AddRef(This)	\
    ( (This)->lpVtbl -> AddRef(This) ) 

#define IEDOverlay_Release(This)	\
    ( (This)->lpVtbl -> Release(This) ) 


#define IEDOverlay_GetTypeInfoCount(This,pctinfo)	\
    ( (This)->lpVtbl -> GetTypeInfoCount(This,pctinfo) ) 

#define IEDOverlay_GetTypeInfo(This,iTInfo,lcid,ppTInfo)	\
    ( (This)->lpVtbl -> GetTypeInfo(This,iTInfo,lcid,ppTInfo) ) 

#define IEDOverlay_GetIDsOfNames(This,riid,rgszNames,cNames,lcid,rgDispId)	\
    ( (This)->lpVtbl -> GetIDsOfNames(This,riid,rgszNames,cNames,lcid,rgDispId) ) 

#define IEDOverlay_Invoke(This,dispIdMember,riid,lcid,wFlags,pDispParams,pVarResult,pExcepInfo,puArgErr)	\
    ( (This)->lpVtbl -> Invoke(This,dispIdMember,riid,lcid,wFlags,pDispParams,pVarResult,pExcepInfo,puArgErr) ) 


#endif /* COBJMACROS */


#endif 	/* C style interface */




#endif 	/* __IEDOverlay_INTERFACE_DEFINED__ */



#ifndef __EDOverlaysLib_LIBRARY_DEFINED__
#define __EDOverlaysLib_LIBRARY_DEFINED__

/* library EDOverlaysLib */
/* [version][uuid] */ 


EXTERN_C const IID LIBID_EDOverlaysLib;

EXTERN_C const CLSID CLSID_EDOverlay;

#ifdef __cplusplus

class DECLSPEC_UUID("c28d7ba7-5c9d-4af1-be7c-848c231c298b")
EDOverlay;
#endif
#endif /* __EDOverlaysLib_LIBRARY_DEFINED__ */

/* Additional Prototypes for ALL interfaces */

/* end of Additional Prototypes */

#ifdef __cplusplus
}
#endif

#endif


