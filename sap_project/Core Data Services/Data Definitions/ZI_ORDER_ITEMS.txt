@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'order items cds view'
@Metadata.ignorePropagatedAnnotations: true
define root view entity ZI_ORDER_ITEMS as select from zorder_items
{
    key order_id,
    key food_id,
    quantity   
}
