Table API
=========
**See demo: **[http://tapi-ozooner.rhcloud.com/](http://tapi-ozooner.rhcloud.com/)
What can it do?
---------------
This module allows developers to expose drupal-style queries (**db_select**) as a pageable-sortable ajax table with as little coding as possible:
![tapi-screen](http://i.imgur.com/4DQV8i8.png)

 - Supports join queries*
 - Supports filtering
 - Supports editing, inserting and deleting data
 
*queries spanning over multiple tables do not support editing/deleting/inserting
Installation
------------
Installation process is quite standard, however be sure to configure permissions according to your use-case. The permissions protect callback endpoints: ![table_api permissions](http://i.imgur.com/cfRcB6A.png)
Usage
-----
This module is for developers only as it is meant to integrate into other modules. Simple usage: 
1) Construct the query you want to expose: 

       db_set_active();
       $query = db_select('tapi_demo')
       ->fields('tapi_demo',array('id','field1', 'field2', 'field3'));

2) Tell table API how to render the table:

    $data = array();
    $data['query'] = $query;
    $data['limit'] = 20; //Limit per page
    $data['sort'] = 'asc'; //Default sort order
    $data['order'] = 'id'; //Default sort column
    $data['page'] = 0; //Default start page

3) Pass $data object to render function to get back html:

    $html = table_api_render($data)
 4) Display the table in a form (or anywhere else):

      $form['table_data'] = array(
            '#markup' => $html
        );
       
Enable editing, inserting and deleting
--------------------------------------
Adding new functionality in just one line:

    $data['delete'] = 'id'; //delete on id condition
    $data['editable'] = array('field1', 'field2'); //enables editing following fields
    $data['update_cond'] = 'id'; //update on id contition
    $data['insert'] = true; //enable insertion of new rows
    
Filtering & callbacks
--------
Please refer to table_api_demo.module to see how filtering and callbacks are implemented. 
