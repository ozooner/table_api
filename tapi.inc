<?php
/**
 * Callback function that renders the table with supplied parameters
 */
function table_api_callback()
{
    die(table_api_render());
}

/**
 * Delete callback
 */
function table_api_delete()
{
    $data = drupal_json_decode($_POST['data']);
    //Make sure we have a condition
    if(!isset($data['where_value']) || $data['where_value'] == '') {
        $result['status'] = 'error';
        $result['message'] = t('Where value was not passed properly');
        drupal_json_output($result);
        return;
    }
    try{
        $cache_data = cache_get($data['query_uuid'])->data;
        if($cache_data == false) {
            throw new Exception('Query not found in cache');
        }
        $query = $cache_data['query'];
        if(!isset($cache_data['delete'])) {
            throw new Exception('No delete condition field found');
        }
        $fields = array_keys($query->getFields());
        if(!in_array($cache_data['delete'], $fields)) {
            throw new Exception('Delete condition field not found in original query');
        }
        $tables = $query->getTables();
        if(count($tables) > 1) {
            throw new Exception('Can not delete, because query selects from multiple tables');
        }
        $database = table_api_resolve_database($query);
        db_set_active($database);

        $table = reset(array_keys($tables));
        db_delete($table)
        ->condition($cache_data['delete'], $data['where_value'])
        ->execute();
        $result['status'] = 'success';
    }
    catch(Exception $e){
        $result['status'] = 'error';
        $result['message'] = $e->getMessage();
    }
    db_set_active();
    drupal_json_output($result);
}

/*
 * Update callback
 */
function table_api_update()
{
    $data = drupal_json_decode($_POST['data']);
    //prevent accidentally updating entire table
    if(!isset($data['where_value']) || $data['where_value'] == '') {
        $result['status'] = 'error';
        $result['message'] = t('Where value was not passed properly');
        drupal_json_output($result);
        return;
    }
    try{
        $cache_data = cache_get($data['query_uuid'])->data;
        if($cache_data == false) {
            throw new Exception('Query not found in cache');
        }
        if(!isset($cache_data['update_cond']) || !isset($cache_data['editable'])) {
            throw new Exception('Query is not updateable, missing mandatory fields');
        }
        $query = $cache_data['query'];
        $fields = array_keys($query->getFields());
        if(!in_array($data['update_cond'], array_keys($fields))) {
            throw new Exception('Invalid update condition field not in original query');
        }
        if(!in_array($data['update_field'], $cache_data['editable'])) {
            throw new Exception($data['update_field'] . ' is not marked as editable field');
        }
        $tables = $query->getTables();
        if(count($tables) > 1) {
            throw new Exception('Can not update, because query selects from multiple tables');
        }
        $database = table_api_resolve_database($query);
        db_set_active($database);
    
        $table = reset(array_keys($tables));
        db_update($table)
        ->fields(array($data['update_field'] => $data['update_value']))
        ->condition($cache_data['update_cond'], $data['where_value'])
        ->execute();
        $result['status'] = 'success';
    }
    catch(Exception $e){
        $result['status'] = 'error';
        $result['message'] = $e->getMessage();
    }
    db_set_active();
    drupal_json_output($result);
}

/*
 * Insert callback
 */
function table_api_insert()
{
    $data = drupal_json_decode($_POST['data']);
    //prevent accidentally updating entire table
    try{
        $cache_data = cache_get($data['query_uuid'])->data;
        $query = $cache_data['query'];
        if($query == false) {
            throw new Exception('Query not found in cache');
        }
        if(!isset($cache_data['insert']) || !$cache_data['insert']) {
            throw new Exception('Inserting to this table is not allowed');
        }
        unset($data['query_uuid']);
        //remove empty values so we can use DB defaults
        $data = array_filter($data);
        $tables = $query->getTables();
        if(count($tables) > 1) {
            throw new Exception('Can not update, because query selects from multiple tables');
        }
        $table = reset(array_keys($tables));
        $database = table_api_resolve_database($query);
        db_set_active($database);
        db_insert($table)
        ->fields($data)
        ->execute();
        $result['status'] = 'success';
    }
    catch(Exception $e){
        $result['status'] = 'error';
        $result['message'] = $e->getMessage();
    }
    db_set_active();
    drupal_json_output($result);
}

/**
 * To access the database name that was used in the initial
 * select query, we need to use reflection to access protected property
 * @param SelectQuery $query
 * @return string database used in the query
 */
function table_api_resolve_database($query)
{
    $reflectedClass = new ReflectionClass($query);
    $property = $reflectedClass->getProperty('connectionKey');
    $property->setAccessible(true);
    $database = $property->getValue($query);
    return $database;
}
