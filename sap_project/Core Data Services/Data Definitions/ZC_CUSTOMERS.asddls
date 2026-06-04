@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Customers Projection View'

define root view entity ZC_CUSTOMERS
provider contract transactional_query
as projection on ZI_CUSTOMERS
{
    key customer_id,
    name,
    phone_number,
    address
}
