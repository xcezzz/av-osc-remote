var _matrices_base = require('./_matrices_base')

module.exports = class Multipush extends _matrices_base {

    static defaults() {

        return {
            type:'multipush',
            id:'auto',

            _matrix: 'Matrix',

            matrix: [2,2],
            start:0,

            style:'style',

            label:'auto',
            left:'auto',
            top:'auto',
            width:'auto',
            height:'auto',
            color:'auto',
            css:'',

            _behaviour:'behaviour',

            traversing:true,

            _osc:'osc',

            on:1,
            off:0,
            value:'',
            norelease:false,
            precision:2,
            address:'auto',
            preArgs:[],
            split:false,
            target:[]
        }

    }

    constructor(options) {

        super(options)

        var strData = JSON.stringify(options.props)

        var parsers = require('../../parser'),
            parsewidgets = parsers.widgets

        for (var i = this.start; i < this.getProp('matrix')[0] * this.getProp('matrix')[1] + this.start; i++) {

            var data = JSON.parse(strData)

            data.top = data.left = data.height = data.width = 'auto'
            data.type = 'push'
            data.id = this.getProp('id') + '/' + i
            data.label = i
            data.address = this.getProp('split') ? this.getProp('address') + '/' + i : this.getProp('address')
            data.preArgs = this.getProp('split') ? this.getProp('preArgs') : [].concat(this.getProp('preArgs'), i)
            data.color = typeof this.getProp('color') == 'object' ? '' + this.getProp('color')[i % this.getProp('color').length] : this.getProp('color')
            data.css = ''

            var element = parsewidgets([data],this.widget)
            element[0].style.setProperty('width', 100/this.getProp('matrix')[0] + '%')
            element[0].classList.add('not-editable')

            this.value[i-this.start] = this.getProp('off')

        }

        if (this.getProp('traversing')) this.widget.enableTraversingGestures()

        this.registerHashes()

    }

}
