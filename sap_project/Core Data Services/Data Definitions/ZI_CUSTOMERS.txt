@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Customers CDS View'
define root view entity ZI_CUSTOMERS as select from zcustomerss
{
    key customer_id,
    name,
    phone_number,
    address   
}
