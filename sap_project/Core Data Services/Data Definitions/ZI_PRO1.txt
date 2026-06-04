@AbapCatalog.sqlViewName: 'ZP_DEMO1'
@AbapCatalog.compiler.compareFilter: true
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'CDS view'
define view ZI_pro1 as select from vbak
 inner join vbap
    on vbak.vbeln = vbap.vbeln
{
    vbak.vbeln,
    vbak.auart,
    vbak.erdat,
    vbak.kunnr,
    vbak.vkorg,
    vbap.posnr,
    vbap.matnr,
    vbap.arktx,
    vbap.kwmeng
}
