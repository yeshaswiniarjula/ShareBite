@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Food Menu CDS View'
define root view entity ZI_FOOD_MENU as select from zfood_menu
{
    key food_id,
    food_name,
    category,
    price,
    waers,
    available
}
