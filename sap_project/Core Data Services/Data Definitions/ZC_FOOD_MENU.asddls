@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Food Menu Projection View'

define root view entity ZC_FOOD_MENU provider contract transactional_query
  as projection on ZI_FOOD_MENU
{
    key food_id,
    food_name,
    category,
    price,
    waers,
    available
}
