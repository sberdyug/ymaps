ymaps.modules.define('RandomPointsGenerator', [
    'coordSystem.geo'
], function (provide, coordSystem) {
    /**
     * Random-генератор меток.
     * @class
     * @name RandomPointsGenerator
     * @param {Number} count Количество меток которые надо создать.
     * @example
     var placemarks = RandomPointsGenerator.generate(200).atBounds(myMap.getBounds());
     */
    function RandomPointsGenerator(count) {
        this.count = count || 0;
    }

    /**
     * Статический метод для удобства инстанцирования.
     * @static
     * @function
     * @name RandomPointsGenerator.generate
     * @param {Number} count Количество меток которые надо создать.
     * @returns {RandomPointsGenerator} Экземпляр генератора меток.
     */
    RandomPointsGenerator.generate = function (count) {
        return new RandomPointsGenerator(count);
    };

    /**
     * Устанавливает количество меток для генерации.
     * @function
     * @name RandomPointsGenerator.generate
     * @param {Number} count Количество меток которые надо создать.
     * @returns {RandomPointsGenerator} Экземпляр генератора меток.
     */
    RandomPointsGenerator.prototype.generate = function (count) {
        this.count = count;

        return this;
    };

    /**
     * Генерит случайным образом метки в области bounds.
     * @function
     * @name RandomPointsGenerator.atBounds
     * @param {Number[][]} bounds Область видимости меток.
     * @returns {ymaps.Placemark[]} Массив меток.
     */
    RandomPointsGenerator.prototype.atBounds = function (bounds) {
        // протяженность области просмотра в градусах
        var span = [bounds[1][0] - bounds[0][0], bounds[1][1] - bounds[0][1]],
            points = [];

        for(var i = 0; i < this.count; i++) {
            points[i] = this.createPlacemark([Math.random() * span[0] + bounds[0][0], Math.random() * span[1] + bounds[0][1]], i);
        }

        return points;
    };

    /**
     * Генерит случайным образом метки внутри окружности с данным центром и радиусом.
     * @function
     * @name RandomPointsGenerator.atCenterAndRadius
     * @param {Number[]} center Координаты центра окружности.
     * @param {Number} radius Радиус окружности в метрах.
     * @returns {ymaps.Placemark[]} Массив меток.
     */
    RandomPointsGenerator.prototype.atCenterAndRadius = function (center, radius) {
        var distance, direction, coords, points = [];

        for(var i = 0; i < this.count; i++) {
            direction = [Math.random() - Math.random(), Math.random() - Math.random()];
            distance = radius * Math.random();
            coords = coordSystem.solveDirectProblem(center, direction, distance).endPoint;
            points[i] = this.createPlacemark(coords, i);
        }

        return points;
    };

    /**
     * TODO
     * Генерит случайным образом метки внутри области с данным центром и линейными размерами.
     * @function
     * @name RandomPointsGenerator.atCenterAndSize
     * @param {Number[]} center Координаты центра области.
     * @param {Number[]} size Линейные размеры области в метрах.
     * @returns {ymaps.Placemark[]} Массив меток.
     */
    RandomPointsGenerator.prototype.atCenterAndSize = function (center, size) {};

    /**
     * Создает метку по координатам.
     * @function
     * @name RandomPointsGenerator.createPlacemark
     * @param {Number[]} coordinates Массив координат.
     * @param {Number} index Индекс метки.
     * @returns {ymaps.Placemark} Метка.
     */
    RandomPointsGenerator.prototype.createPlacemark = function (coordinates, index) {
        return new ymaps.GeoObject({
            geometry: {
                type: "Point",
                coordinates: coordinates
            },
            properties: this.getPointData(index)
        }, this.getPointOptions(index));
    };

    /**
     * Метод для перекрытия. Возвращает объект с данными,
     * который передается как поле properties в конструктор геообъекта.
     * @function
     * @name RandomPointsGenerator.getPointData
     * @param {Number} index Индекс метки.
     * @returns {Object} Данные метки.
     */
    RandomPointsGenerator.prototype.getPointData = function (index) {
        return {};
    };

    /**
     * Метод для перекрытия. Возвращает объект с опциями,
     * который передается как параметр options в конструктор геообъекта.
     * @function
     * @name RandomPointsGenerator.getPointOptions
     * @param {Number} index Индекс метки.
     * @returns {Object} Опции метки.
     * @example
     var generator = RandomPointsGenerator.generate(200);

     // Перекрываем метод для создания меток со случайным хначением опции preset.
     generator.getPointOptions = function (i) {
         var presets = ['islands#blueIcon', 'islands#orangeIcon', 'islands#darkblueIcon', 'islands#pinkIcon'];

         return {
             preset: presets[Math.floor(Math.random() * presets.length)]
         };
     };
     */
    RandomPointsGenerator.prototype.getPointOptions = function (index) {
        return {};
    };

    provide(RandomPointsGenerator);
});

ymaps.modules.define('PieChartClusterer', [
    'Clusterer',
    'util.defineClass',
    'util.extend',
    'PieChartClusterer.icon.params',
    'PieChartClusterer.component.Canvas'
], function (provide, Clusterer, defineClass, extend, iconParams, PieChartClustererCanvas) {

    var styleRegExp = /#(.*)Icon/,
        getIconStyle = function (preset) {
            return preset.match(styleRegExp)[1];
        },
        PieChartClusterer = defineClass(function (options) {
            PieChartClusterer.superclass.constructor.call(this, options);

            this._canvas = new PieChartClustererCanvas(iconParams.icons.large.size);
            this._canvas.options.setParent(this.options);
        }, Clusterer, {
            createCluster: function (center, geoObjects) {
                // Создаем метку-кластер с помощью стандартной реализации метода.
                var clusterPlacemark = PieChartClusterer.superclass.createCluster.call(this, center, geoObjects),
                    styleGroups = geoObjects.reduce(function (groups, geoObject) {
                        var style = getIconStyle(geoObject.options.get('preset', 'islands#blueIcon'));

                        groups[style] = ++groups[style] || 1;

                        return groups;
                    }, {}),
                    iconUrl = this._canvas.generateIconDataURL(styleGroups, geoObjects.length),
                    clusterOptions = {
                        clusterIcons: [
                            extend({ href: iconUrl }, iconParams.icons.small),
                            extend({ href: iconUrl }, iconParams.icons.medium),
                            extend({ href: iconUrl }, iconParams.icons.large)
                        ],
                        clusterNumbers: iconParams.numbers
                    };

                clusterPlacemark.options.set(clusterOptions);

                return clusterPlacemark;
            }
        });

    provide(PieChartClusterer);
});

ymaps.modules.define('PieChartClusterer.component.Canvas', [
    'option.Manager',
    'PieChartClusterer.icon.colors'
], function (provide, OptionManager, iconColors) {
    var DEFAULT_OPTIONS = {
        iconStrokeStyle: 'white',
        iconLineWidth: 2,
        iconCoreRadius: 23,
        iconCoreFillStyle: 'white'
    };

    var Canvas = function (size) {
        this._canvas = document.createElement('canvas');
        this._canvas.width = size[0];
        this._canvas.height = size[1];

        this._context = this._canvas.getContext('2d');
        this.options = new OptionManager({});
    };

    Canvas.prototype.generateIconDataURL = function (styleGroups, total) {
        this._drawIcon(styleGroups, total);

        return this._canvas.toDataURL();
    };

    Canvas.prototype._drawIcon = function (styleGroups, total) {
        var startAt = 0, endAt = 360,
            ctx = this._context,
            x = this._canvas.width / 2,
            y = this._canvas.height / 2,
            lineWidth = this.options.get('iconLineWidth', DEFAULT_OPTIONS.iconLineWidth),
            strokeStyle = this.options.get('iconStrokeStyle', DEFAULT_OPTIONS.iconStrokeStyle),
            radius = Math.floor((x + y - lineWidth) / 2);

        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;

        Object.keys(styleGroups).forEach(function (style) {
            var num = styleGroups[style];

            endAt = startAt + (num * 360 / total);
            ctx.fillStyle = this._getStyleColor(style);

            if(total > num) {
                startAt = this._drawSector(x, y, radius, startAt, endAt);
            }
            else {
                this._drawCircle(x, y, radius);
            }
        }, this);

        this._drawCore(x, y);
    };

    Canvas.prototype._drawCore = function (x, y) {
        var ctx = this._context,
            fillStyle = this.options.get('iconCoreFillStyle', DEFAULT_OPTIONS.iconCoreFillStyle),
            radius = this.options.get('iconCoreRadius', DEFAULT_OPTIONS.iconCoreRadius);

        ctx.fillStyle = fillStyle;
        this._drawCircle(x, y, radius);
    };

    Canvas.prototype._drawCircle = function (x, y, radius) {
        var ctx = this._context;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    };

    Canvas.prototype._drawSector = function (x, y, radius, startAt, endAt) {
        var ctx = this._context;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, this._toRadians(startAt), this._toRadians(endAt));
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        return endAt;
    };

    Canvas.prototype._toRadians = function (deg) {
        return deg * Math.PI / 180;
    };

    Canvas.prototype._getStyleColor = function (style) {
        return iconColors[style];
    };

    provide(Canvas);
});

ymaps.modules.define('PieChartClusterer.icon.colors', [], function (provide) {
    var colors = {
        blue: '#1E98FF',
        red: '#ED4543',
        darkOrange: '#E6761B',
        night: '#0E4779',
        darkBlue: '#177BC9',
        pink: '#F371D1',
        gray: '#B3B3B3',
        brown: '#793D0E',
        darkGreen: '#1BAD03',
        violet: '#B51EFF',
        black: '#595959',
        yellow: '#FFD21E',
        green: '#56DB40',
        orange: '#FF931E',
        lightBlue: '#82CDFF',
        olive: '#97A100'
    };

    provide(colors);
});
ymaps.modules.define('PieChartClusterer.icon.params', [
    'shape.Circle',
    'geometry.pixel.Circle'
], function (provide, CircleShape, PixelCircleGeometry) {
    provide({
        icons: {
            small: {
                size: [46, 46],
                offset: [-23, -23],
                shape: new CircleShape(new PixelCircleGeometry([0, 2], 21.5))
            },
            medium: {
                size: [58, 58],
                offset: [-29, -29],
                shape: new CircleShape(new PixelCircleGeometry([0, 2], 27.5))
            },
            large: {
                size: [71, 71],
                offset: [-35.5, -35.5],
                shape: new CircleShape(new PixelCircleGeometry([0, 2], 34))
            }
        },
        numbers: [ 10, 100 ]
    });
});