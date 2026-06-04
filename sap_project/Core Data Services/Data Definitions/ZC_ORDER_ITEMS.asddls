@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Order Items Projection View'

define root view entity ZC_ORDER_ITEMS
provider contract transactional_query
as projection on ZI_ORDER_ITEMS
{
    key order_id,
    key food_id,
    quantity
}
