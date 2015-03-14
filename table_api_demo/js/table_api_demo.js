//  This code integrates filtering into tapi.
jQuery(document).ready(
    function($) {
        // Intercept click event on search to add conditions and refresh table.
        $(document).on(
            "click", "#edit-tapi-search", function(e){ 
                e.preventDefault();
                // Load desired filter values from input field.
                var field1Filter = $('#edit-filter-field1').val();
                // Clear previous filter values.
                clearConditions();
                // In this case we add a LIKE filter (multiple conditions can be added).
                addCondition('field1', field1Filter + '%', 'LIKE');
                // Issue a table refresh.
                refreshTable();
        }
        );
    }
);
