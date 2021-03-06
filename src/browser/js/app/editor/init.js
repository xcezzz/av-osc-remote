var {getObjectData, updateDom, incrementWidget} = require('./data-workers'),
    {editObject, editClean} = require('./edit-objects'),
    createPopup = require('../utils').createPopup,
    {widgets, categories} = require('../widgets'),
    {widgetManager} = require('../managers'),
    menu = require('./context-menu')



var init = function(){

    $('body').off('.editor').on('fake-click fake-right-click',function(e,d){

        if (!EDITING) return

        // ignore mouse event when fired by a simulated touch event
        // already handled in drag.js
        // if (e.type=='mousedown' && e.originalEvent.sourceCapabilities.firesTouchEvents) return

        $('.context-menu').remove()

        if (e.target.classList.contains('not-editable')) return

        var target = e.target.hasAttribute('data-widget')  || e.target.classList.contains('widget') ?
                        $(e.target).not('.not-editable') : $(e.target).closest('.widget:not(.not-editable)')

        if (!target.length) return

        var widget = widgetManager.widgets[target.attr('data-widget')]

        if (!widget) return

        var container = widget.container,
            parent = container.parent(),
            index = container.index(),
            data = getObjectData(container),
            type = widget.props.type == 'tab' ? 'tab' : 'widget'

        editObject(container,data)

        if (e.type!='fake-right-click') return

        if (container.hasClass('root-container')) {
            menu(d,{
                '<i class="fa fa-plus"></i> Add tab': function(){
                    data.tabs.push({})
                    updateDom(container,data)
                }
            },'body')

            return
        }

        var actions = {},
            clickX = Math.round((d.offsetX + d.target.scrollLeft) / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH,
            clickY = Math.round((d.offsetY + d.target.scrollTop)  / (GRIDWIDTH * PXSCALE)) * GRIDWIDTH
        // actions['<i class="fa fa-edit"></i> Edit'] = function(){editObject(container,data)}

        // actions['<i class="fa fa-object-group"></i> Edit parent'] = function(){parent.trigger('fake-click')}

        if (type=='widget') actions['<i class="fa fa-copy"></i> Copy'] = function(){CLIPBOARD=JSON.stringify(data)}

        if (type=='widget') actions['<i class="fa fa-cut"></i> Cut'] = function(){
            CLIPBOARD=JSON.stringify(data)
            var parentContainer = container.parents('.widget').first(),
                parentData = getObjectData(parentContainer)

            parentData.widgets.splice(index,1)
            updateDom(parentContainer,parentData)
        }

        if (((type=='widget' && widgets[data.type].defaults().widgets) || (type=='tab')) && (!data.tabs||!data.tabs.length)) {

            if (CLIPBOARD!=null) {
                actions['<i class="fa fa-paste"></i> Paste'] = {
                    '<i class="fa fa-plus-circle"></i> ID + 1':function(){
                        data.widgets = data.widgets || []
                        var newData = incrementWidget(JSON.parse(CLIPBOARD))


                        if (!target.hasClass('tablink')) {
                            newData.top = clickY
                            newData.left= clickX
                        } else {
                            delete newData.top
                            delete newData.left
                        }

                        data.widgets.push(newData)
                        updateDom(container,data)
                    },
                    '<i class="fa fa-clone"></i> Clone':function(){
                        data.widgets = data.widgets || []
                        var newData = JSON.parse(CLIPBOARD)
                        if (!target.hasClass('tablink')) {
                            newData.top = clickY
                            newData.left= clickX
                        } else {
                            delete newData.top
                            delete newData.left
                        }
                        data.widgets.push(newData)
                        updateDom(container,data)
                    }
                }
            }

            actions['<i class="fa fa-plus"></i> Add widget'] = {}
            for (let category in categories) {
                actions['<i class="fa fa-plus"></i> Add widget'][category] = {}
                for (let t in categories[category]) {
                    let wtype = categories[category][t]
                    actions['<i class="fa fa-plus"></i> Add widget'][category][wtype] =  function(){
                            data.widgets = data.widgets || []
                            var newData = {type:wtype}
                            if (!target.hasClass('tablink')) {
                                newData.top = clickY
                                newData.left= clickX
                            }
                            data.widgets.push(newData)
                            updateDom(container,data)
                    }

                }
            }

        }
        if  (((type=='widget' && widgets[data.type].defaults().tabs) || (type=='tab')) && (!data.widgets||!data.widgets.length)) {

            actions['<i class="fa fa-plus"></i> Add tab'] = function(){
                data.tabs = data.tabs || []
                data.tabs.push({})
                updateDom(container,data)
            }

        }

        actions['<i class="fa fa-trash"></i> Delete'] = function(){
            var popup = createPopup('Are you sure ?',`
                <div class="actions">
                    <a class="btn warning confirm-delete">DELETE</a>
                    <a class="btn cancel-delete">CANCEL</a>
                </div>
            `)
            $('.confirm-delete').click(function(){
                popup.close()
                var parentContainer = container.parents('.widget').first(),
                    parentData = getObjectData(parentContainer)


                if (widget.props.type != 'tab') {
                    parentData.widgets.splice(index,1)
                } else {
                    parentData.tabs.splice(index,1)
                }

                updateDom(parentContainer,parentData)
            })
            $('.cancel-delete').click(function(){
                popup.close()
            })
            $(document).on('keydown.popup', function(e){
                if (e.keyCode==13) $('.confirm-delete').click()
            })


        }

        menu(d,actions,'body')

    })

}

module.exports = init
