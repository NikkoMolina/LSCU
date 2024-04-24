var $ = jQuery;

function clickCheckBoxNdiSelect()
{
    var processName = 'clickCheckBoxNdiSelect';

    $("[id^='custpage_ndi_soselect']").click(function()
    {
        try
        {
            var totalSOCheckboxChecked = $("[id^='custpage_ndi_soselect']:checked").length;
            var isEnableButtCreateSalesOrderInNewWindow = (totalSOCheckboxChecked > 0) ? true : false;

            if (isEnableButtCreateSalesOrderInNewWindow)
            {
                $("[id='tr_custpage_ndi_butt_create_so_in_new_window']").removeClass("tabBntDis").addClass("tabBnt");
                $("[id='custpage_ndi_butt_create_so_in_new_window']").removeAttr("disabled");
            }

            if (!isEnableButtCreateSalesOrderInNewWindow)
            {
                $("[id='tr_custpage_ndi_butt_create_so_in_new_window']").removeClass("tabBnt").addClass("tabBntDis");
                $("[id='custpage_ndi_butt_create_so_in_new_window']").attr("disabled","disabled");
            }
        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString())
        }            
    });

    $("[id^='custpage_ndi_poselect']").click(function()
    {
        try
        {
            var totalPOCheckboxChecked = $("[id^='custpage_ndi_poselect']:checked").length;
            var isEnableButtCreatePurchOrderInNewWindow = (totalPOCheckboxChecked > 0) ? true : false;

            if (isEnableButtCreatePurchOrderInNewWindow)
            {
                $("[id='tr_custpage_ndi_butt_create_po_in_new_window']").removeClass("tabBntDis").addClass("tabBnt");
                $("[id='custpage_ndi_butt_create_po_in_new_window']").removeAttr("disabled");
            }

            if (!isEnableButtCreatePurchOrderInNewWindow)
            {
                $("[id='tr_custpage_ndi_butt_create_po_in_new_window']").removeClass("tabBnt").addClass("tabBntDis");
                $("[id='custpage_ndi_butt_create_po_in_new_window']").attr("disabled","disabled");
            }
        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString())
        }            
    });
}

function clickButtMarkAll()
{
    var processName = 'clickCheckBoxNdiSelect';

    $("[id='custpage_ndi_soprojecttasksmarkall']").click(function()
    {
        try
        {
            $("[id='tr_custpage_ndi_butt_create_so_in_new_window']").removeClass("tabBntDis");
            $("[id='tr_custpage_ndi_butt_create_so_in_new_window']").removeClass("tabBnt");
            $("[id='tr_custpage_ndi_butt_create_so_in_new_window']").addClass("tabBnt");
            $("[id='custpage_ndi_butt_create_so_in_new_window']").removeAttr("disabled");
        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString())
        }            
    });

    $("[id='custpage_ndi_poprojecttasksmarkall']").click(function()
    {
        try
        {
            $("[id='tr_custpage_ndi_butt_create_po_in_new_window']").removeClass("tabBntDis");
            $("[id='tr_custpage_ndi_butt_create_po_in_new_window']").removeClass("tabBnt");
            $("[id='tr_custpage_ndi_butt_create_po_in_new_window']").addClass("tabBnt");
            $("[id='custpage_ndi_butt_create_po_in_new_window']").removeAttr("disabled");
        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString())
        }            
    });
}

function clickButtUnmarkAll()
{
    var processName = 'clickButtUnmarkAll';

    $("[id='custpage_ndi_soprojecttasksunmarkall']").click(function()
    {
        try
        {   
            $("[id='tr_custpage_ndi_butt_create_so_in_new_window']").removeClass("tabBntDis");
            $("[id='tr_custpage_ndi_butt_create_so_in_new_window']").removeClass("tabBnt");
            $("[id='tr_custpage_ndi_butt_create_so_in_new_window']").addClass("tabBntDis");
            $("[id='custpage_ndi_butt_create_so_in_new_window']").attr("disabled","disabled");
        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString())
        }            
    });

    $("[id='custpage_ndi_poprojecttasksunmarkall']").click(function()
    {
        try
        {   
            $("[id='tr_custpage_ndi_butt_create_po_in_new_window']").removeClass("tabBntDis");
            $("[id='tr_custpage_ndi_butt_create_po_in_new_window']").removeClass("tabBnt");
            $("[id='tr_custpage_ndi_butt_create_po_in_new_window']").addClass("tabBntDis");
            $("[id='custpage_ndi_butt_create_po_in_new_window']").attr("disabled","disabled");
        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString())
        }            
    });
}

$(function()
{
    clickCheckBoxNdiSelect();
    clickButtMarkAll();
    clickButtUnmarkAll();

});
