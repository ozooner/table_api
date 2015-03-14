jQuery(document).ready(
    function($) {
        /* intercept anchor tags in pager and header and fetch via ajax instead */
        $(document).on(
            "click", "#tapi-table-container .pager li a, #tapi-table-container th a", function(e){

                // Parses GET query parameters and returns value for requested name.
                function getQueryParameterByName(query, name) {
                    var match = RegExp('[?&]' + name + '=([^&]*)').exec(query);
                    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
                }

                var url = $(this).attr('href');
                var query = url.substr(url.indexOf('?'));

                var params = {
                    page : getQueryParameterByName(query, 'page'),
                    sort : getQueryParameterByName(query, 'sort'),
                    order : getQueryParameterByName(query, 'order'),
                    conditions :JSON.parse(jQuery('input[name=tapi_conditions]').val()),
                    query_uuid : $('input[name=tapi_query_uuid]').val(),
                };
                submitTable(params);
                return false;
            }
        );

        /* edit button click handler, add input tag with save button */
        $(document).on(
            "click", "#tapi-table-container .tapi-edit", function(e){
                e.preventDefault();
                var element = $(this).parent();
                var content = element.html();
                element.html("");
                // Remove the button before inserting content to input.
                var cut = content.indexOf('<a href="#" class="tapi-edit"></a>');
                content = content.substring(0,cut);
                $("<input>")
                .attr('class','tapi-edit-input')
                .attr('value', content)
                .attr('type', 'text')
                .prependTo(element)
                .focus();

                $("<a>")
                .attr('class','tapi-save')
                .attr('href','#')
                .appendTo(element);
            }
        );

        /* Inline edit event handler, submit changes and remove input tag */
        $(document).on(
            "click", "#tapi-table-container .tapi-save", function(e){
                element = $(this).parent();
                // Take content from sibling input tag.
                content = $(this).prevAll("input:first").val();
                params = {
                    update_value : content,
                    update_field : $(this).parent().attr('rel'),
                    where_value : $(this).parent().parent().attr('update_cond'),
                    query_uuid : $('input[name=tapi_query_uuid]').val(),
                };
                params = {
                    data : JSON.stringify(params)
                };
                $.ajax(
                    {
                        type : "POST",
                        cache : false,
                        url : Drupal.settings.basePath + '?q=tapi/update',
                        data : params,
                        dataType : 'text',
                        error : function(request, status, error) {
                            alert(status);
                        },
                        success : function(data, status, request) {
                            data = JSON.parse(data);
                            if(data.status == 'success') {
                                // Replace input field with new content.
                                element.html(content);
                                // Re-create edit button.
                                $("<a>")
                                .attr('class','tapi-edit')
                                .attr('href','#')
                                .appendTo(element);
                            }
                            else{
                                alert(data.message);
                            }
                        }
                    }
                );
                return false;
            }
        );

        /* Delete event handler */
        $(document).on(
            "click", "#tapi-table-container .tapi-delete", function(e){
                if (!confirm(Drupal.t("Are you sure you want to delete?"))) {
                    return false;
                }
                var row = $(this).parent().parent();
                params = {
                    where_value : row.attr('delete_cond'),
                    query_uuid : $('input[name=tapi_query_uuid]').val(),
                };
                params = {
                    data : JSON.stringify(params)
                };
                $.ajax(
                    {
                        type : "POST",
                        cache : false,
                        url : Drupal.settings.basePath + '?q=tapi/delete',
                        data : params,
                        dataType : 'text',
                        error : function(request, status, error) {
                            alert(status);
                        },
                        success : function(data, status, request) {
                            data = JSON.parse(data);
                            if(data.status == 'success') {
                                row.remove();
                            }
                            else{
                                alert(data.message);
                            }
                        }
                    }
                );

                return false;
            }
        );

        /* Insert button click handler */
        $(document).on(
            "click", "#tapi-table-container .tapi-insert-btn", function(e){
                params = {
                    query_uuid : $('input[name=tapi_query_uuid]').val(),
                };
                fields = $('#tapi-table-container .tapi-insert').each(
                    function(index, value){
                        current = $(this);
                        field = current.attr('rel');
                        value = current.val();
                        params[field] = value;
                    }
                );
                params = {
                    data : JSON.stringify(params)
                };
                $.ajax(
                    {
                        type : "POST",
                        cache : false,
                        url : Drupal.settings.basePath + '?q=tapi/insert',
                        data : params,
                        dataType : 'text',
                        error : function(request, status, error) {
                            alert(status);
                        },
                        success : function(data, status, request) {
                            data = JSON.parse(data);
                            if(data.status == 'success') {
                                refreshTable();
                            }
                            else{
                                alert(data.message);
                            }
                        }
                    }
                );
                return false;
            }
        );
    }
);

// ------------------Window scope functions-----------------.

/**
 * Clears all conditions from the table, used to apply different conditions or remove filters.
 */
function clearConditions(){
    conditions = [];
    jQuery('input[name=tapi_conditions]').val(JSON.stringify(conditions));
}

/**
 * Adds one condition to the table query.
 *
 * @param field - on which the condition applies e.g 'id'
 * @param value - value it must have e.g '23'
 * @param operator - operator e.g '>'
 * Example would result WHERE id > 23 condition
 */
function addCondition(field, value, operator){
    conditions = JSON.parse(jQuery('input[name=tapi_conditions]').val());
    condition = {
        field : field,
        operator : operator,
        value : value,
    };
    conditions.push(condition);
    jQuery('input[name=tapi_conditions]').val(JSON.stringify(conditions));
}

/* Refreshes the table with current params loaded from dom */
function refreshTable(){
    var params = {
        page : jQuery('input[name=tapi_page]').val(),
        sort : jQuery('input[name=tapi_sort]').val(),
        order : jQuery('input[name=tapi_order]').val(),
        conditions :JSON.parse(jQuery('input[name=tapi_conditions]').val()),
        query_uuid : jQuery('input[name=tapi_query_uuid]').val(),
    };
    submitTable(params);
}

/* Fetches table with specified parameters */
function submitTable(params) {
    params = {
        data : JSON.stringify(params)
    };
    var table = jQuery('#tapi-table-container');
    table.css(
        {
            opacity : 0.5
        }
    );

    jQuery.ajax(
        {
            type : "POST",
            cache : false,
            url : Drupal.settings.basePath + '?q=tapi',
            data : params,
            dataType : 'text',
            error : function(request, status, error) {
                alert(status);
            },
            success : function(data, status, request) {
                jQuery('#tapi-table-container').replaceWith(data);
                jQuery('input[name=page]').val(params.sort);
                jQuery('input[name=sort]').val(params.order);
                jQuery('input[name=order]').val(params.page);
                table.css(
                    {
                        opacity : 1
                    }
                );
            }
        }
    );
}
