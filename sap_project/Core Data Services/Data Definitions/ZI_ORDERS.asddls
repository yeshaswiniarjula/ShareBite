@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'order cds views'
define root view entity ZI_ORDERS as select from zorders
{
    key order_id,
    cutsomer_id,
    total_amount,
    waers,
    status   
}
