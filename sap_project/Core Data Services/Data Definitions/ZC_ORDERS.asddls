@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Orders Projection View'

define root view entity ZC_ORDERS
provider contract transactional_query
as projection on ZI_ORDERS
{
    key order_id,
    cutsomer_id,
    total_amount,
    waers,
    status
}
