var neon = neon || {};
neon.mapWidgetUtils = (function (){


    function getLatField() {
        return $('#latitude option:selected').val();
    }

    function getLonField() {
        return $('#longitude option:selected').val();
    }

    function getSizeByField() {
        return $('#size-by option:selected').val();
    }

    function getColorByField() {
        return $('#color-by option:selected').val();
    }

    function getDropdownSelectedValue(dropdownName){
        return $('#' + dropdownName + ' option:selected').val();
    }

    function addDropdownChangeListener(dropdownName, onChange){
        $('#' + dropdownName).change(function (){
            onChange.call(this, getDropdownSelectedValue(dropdownName));
        });
    }

    function setLayerChangeListener(onChange){
        $("input[name='layer-group']").change(onChange);
    }

    return {
        addDropdownChangeListener: addDropdownChangeListener,
        setLayerChangeListener: setLayerChangeListener,
        getLatitudeField: getLatField,
        getLongitudeField: getLonField,
        getSizeByField: getSizeByField,
        getColorByField: getColorByField,
        latitudeAndLongitudeAreSelected : function(){
            return (getLatField() && getLonField());
        }
    };

})();