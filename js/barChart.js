class BarChart {

    /**
     * class constructor with basic chart configuration
     * @param {Object} _config 
     * @param {Array} _data 
     * @param {d3.Scale} _colorScale 
     */
    constructor(_config, _data, _colorScale, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || { top: 5, right: 5, bottom: 30, left: 100 }
        };
        this.data = _data;
        this.colorScale = _colorScale;
        this.dispatcher = _dispatcher || null;
        this.series = [];

        this.initVis();
    }

    /**
     * this function is used to initialize scales/axes and append static elements
     */
    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    }

    /**
     * this function is used to prepare the data and update the scales before we render the actual vis
     */
    updateVis() {
        let vis = this;

        const group = ['transportation_cost', 'food_cost', 'healthcare_cost', 'childcare_cost', 'taxes'];

        // Transform data
        let transformedData = group.map(g => {
            let metroValue = vis.data.filter(d => d.isMetro === 'True' && d[g])
                .reduce((a, b) => a + b[g], 0);;
            let nonMetroValue = vis.data.filter(d => d.isMetro === 'False' && d[g])
                .reduce((a, b) => a + b[g], 0);;
            return { group: g, metro: metroValue, nonMetro: nonMetroValue };
        });

        let stack = d3.stack().keys(['metro', 'nonMetro']);

        vis.series = stack(transformedData);

        vis.xValue = d => d.data["group"];
        vis.yValue = d => d.data["metro"] + d.data["nonMetro"];

        vis.renderVis();
    }

    /**
     * this function contains the d3 code for binding data to visual elements
     */
    renderVis() {
        let vis = this;

        vis.chart.selectAll("path").remove();
        vis.chart.selectAll("g").remove();
        vis.chart.selectAll("text").remove();

        const group = ['transportation_cost', 'food_cost', 'healthcare_cost', 'childcare_cost', 'taxes'];

        let transformedData = group.map(g => {
            let metroValue = vis.data.filter(d => d.isMetro === 'True' && d[g])
                .reduce((a, b) => a + b[g], 0);;
            let nonMetroValue = vis.data.filter(d => d.isMetro === 'False' && d[g])
                .reduce((a, b) => a + b[g], 0);;
            return { group: g, metro: metroValue, nonMetro: nonMetroValue };
        });

        let stack = d3.stack()
            .keys(['metro', 'nonMetro']);

        let series = stack(transformedData);

        let maxVal = d3.max(series, function (series) {
            return d3.max(series, function (d) { return d[1]; });
        });

        let x = d3.scaleBand()
            .domain(group)
            .range([0, vis.width])
            .padding([0.2]);

        let y = d3.scaleLinear()
            .domain([0, maxVal])
            .range([vis.height, 0]);

        let xAxis = d3.axisBottom(x);

        let yAxis = d3.axisLeft(y).ticks(6);

        let color = d3.scaleOrdinal()
            .domain(["metro", "nonMetro"])
            .range(["#e7585b", "#f78e39"]);

        vis.chart.append("g")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(xAxis);

        vis.chart.append("g")
            .call(yAxis);

        // Create the bars
        vis.chart.selectAll(".bar")
            .data(series)
            .enter().append("g")
            .attr("fill", function (d) {
                return color(d.key);
            })
            .selectAll("rect")
            .data(function (d) { return d; })
            .enter().append("rect")
            .attr("x", function (d) {
                return x(d.data.group);
            })
            .attr("y", function (d) { return y(d[1]); })
            .attr("width", x.bandwidth())
            .attr("height", function (d) {
                return y(d[0]) - y(d[1]);
            });

        vis.chart.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${-vis.config.margin.left + 20}, ${vis.height / 2}) rotate(-90)`)
            .text("Value ($)");

    }
}