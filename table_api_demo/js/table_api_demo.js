//This code integrates filtering into tapi
jQuery(document).ready(function($) {
    //intercept click event on search to add conditions and refresh table
    $(document).on( "click", "#edit-tapi-search", function(e){ 
        e.preventDefault();
        //load desired filter values from input field
        var field1Filter = $('#edit-filter-field1').val();
        //clear previous filter values
        clearConditions();
        //in this case we add a LIKE filter (multiple conditions can be added)
        addCondition('field1', field1Filter + '%', 'LIKE');
        //issue a table refresh
        refreshTable();
    });
});
