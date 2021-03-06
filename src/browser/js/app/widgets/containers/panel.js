var _widgets_base = require('../common/_widgets_base'),
    autolayout = require('autolayout/dist/autolayout.min.js'),
    {iconify} = require('../../utils'),
    editObject = function(){editObject = require('../../editor/edit-objects').editObject; editObject(...arguments)},
    {widgetManager} = require('../../managers')



module.exports = class Panel extends _widgets_base {

    static defaults() {

        return {
            type:'panel',
            id:'auto',

            _style:'style',

            label:'auto',
            left:'auto',
            top:'auto',
            width:'auto',
            height:'auto',
            scroll:true,
            color:'auto',
            css:'',

            _layout:'layout',

            layout:'',
            spacing:0,



            _osc:'osc',

            value:'',
            precision:0,
            address:'auto',
            preArgs:[],
            target:[],

            _children:'children',

            variables:'@{parent.variables}',

            widgets:[],
            tabs:[]
        }

    }

    constructor(options) {


        super({...options, html: '<div class="panel"></div>'})

        if (!this.getProp('scroll')) this.widget.addClass('noscroll')
        if (this.getProp('tabs') && this.getProp('tabs').length) this.widget.addClass('has-tabs')


        this.value = this.getProp('value') || 0
        this.tabs = []

        var parsers = require('../../parser'),
            parsewidgets = parsers.widgets,
            parsetabs = parsers.tabs

        if (this.getProp('tabs') && this.getProp('tabs').length) {

            this.navigation = $('<div class="navigation"><ul class="tablist"></ul></div>').prependTo(this.widget).find('.tablist')
            this.wrapper = $('<div class="tabs-wrapper"></div>').appendTo(this.widget)

            parsewidgets(this.getProp('tabs'), this.wrapper, this, true)
            this.createNavigation()

            this.navigation.on('fake-click', (e)=>{
                if (!e.target.hasAttribute('data-widget')) return
                this.setValue($(e.target).index(), {sync: true, send:this.value != $(e.target).index()})
            })

            this.wrapper.on('tab-created', (e)=>{
                e.stopPropagation()
                this.createNavigation()

            })

        } else if (this.getProp('widgets') && this.getProp('widgets').length) {

            parsewidgets(this.getProp('widgets'), this.widget, this)
            this.registerHashes()
            if (this.getProp('layout') != '') this.parseLayout()

        }


    }

    registerHashes() {
        this.hashes = [this.hash]
        var widgets = this.widget.find('.widget')
        for (let widget of widgets) {
            if (widget.abstract.hashes) {
                this.hashes = this.hashes.concat(widget.abstract.hashes)
            } else {
                this.hashes.push(widget.abstract.hash)
            }
        }
    }

    createNavigation() {

        this.navigation.empty()
        this.tabs = []

        var tabs = this.wrapper.find('> .widget')

        for (let tab of tabs) {
            let style = tab.abstract.getProp('color') == 'auto' ? '' : `style="--color-custom:${tab.abstract.getProp('color')}"`
            this.tabs.push(tab.abstract)
            this.navigation.append(`<li class="tablink" data-widget="${tab.abstract.hash}" ${style}><a><span>${$(tab).find('> .label span').html()}</span></a></li>`)
        }

        this.registerHashes()

        this.setValue(this.value)

    }

    parseLayout() {

        this.children = this.widget.find('> .widget')

        try {

            var layout = this.getProp('layout').replace(/\$([0-9])+/g, (m)=>{
                return this.children[m.replace('$','')].abstract.getProp('id')
            })

            this.layout = new autolayout.View({
                constraints: autolayout.VisualFormat.parse(layout.split('\\n').join('\n').split(' ').join(''), {extended: true}),
                spacing: this.getProp('spacing')
            });

            this.widget.on('resize',(e, w, h)=>{
                if (!w) {
                    var w = this.widget.width(),
                        h = this.widget.height()
                }
                this.layout.setSize(w,h)
                this.applyLayout()
            })

        } catch(err) {
            throw `Visual Format Language error in ${this.getProp('id')}.layout: ${err.message} (line ${err.line})`
        }

    }

    applyLayout() {
        this.widget.find('> .widget').each((i,widget)=>{
            var id = widget.abstract.getProp('id')
            if (!this.layout.subViews[id]) return
            var $widget = $(widget).addClass('absolute-position').css({'min-height':'auto','min-width':'auto'})
            for (var prop of ['height', 'width', 'top', 'left']) {
                delete widget.abstract.props[prop]
                $widget.css(prop, this.layout.subViews[id][prop] + 'px')
            }
            if ($widget.hasClass('editing')) editObject($widget,widget.abstract.props,true)
            $(window).resize()
        })
    }

    setValue(v, options={}) {
        if (this.tabs.length && typeof v == 'number' && v >= 0 && v < this.tabs.length) {

            for (let i in this.tabs) {

                this.tabs[i].hide()
            }

            this.tabs[v].show()

            this.navigation.find('li').removeClass('on').eq(v).addClass('on')
            this.value = v

            $(window).resize()

            if (options.send) this.sendValue()
            if (options.sync) this.widget.trigger({type:'sync',id:this.getProp('id'),widget:this.widget, linkId:this.getProp('linkId'), options})

        }
    }

    scroll(s) {

        if (!s) {
            return [this.widget.scrollLeft(), this.widget.scrollTop()]
        } else {
            this.widget.scrollLeft(s[0])
            this.widget.scrollTop(s[1])
        }

    }

}
