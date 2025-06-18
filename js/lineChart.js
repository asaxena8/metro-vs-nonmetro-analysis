class LineChart {

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
            containerHeight: _config.containerHeight || 320,
            margin: _config.margin || { top: 5, right: 5, bottom: 60, left: 100 }
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

        const parseDate = d3.timeParse("%d-%b-%y");

        vis.data = vis.data.toSorted((a, b) => parseDate(a.Year) - parseDate(b.Year));

        const aggregatedData = {};

        vis.data.forEach(d => {
            const date = d.date;
            if (!aggregatedData[date]) {
                aggregatedData[date] = { date: date, Unemployed: [], Employed: [] };
            }
            aggregatedData[date].Unemployed.push(d.Unemployed);
            aggregatedData[date].Employed.push(d.Employed);
        });

        const aggregatedArray = Object.values(aggregatedData);

        aggregatedArray.forEach(d => {
            d.Unemployed = d3.mean(d.Unemployed);
            d.Employed = d3.mean(d.Employed);
        });

        const yMax = d3.max(aggregatedArray, d => Math.max(d.Unemployed, d.Employed));

        const xScale = d3.scaleTime()
            .domain(d3.extent(aggregatedArray, d => parseDate(d.date)))
            .range([0, vis.width]);

        const yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([vis.height, 0]);

        const line = d3.line()
            .x(d => xScale(parseDate(d.date)))
            .y(d => yScale(d.Unemployed));

        const line2 = d3.line()
            .x(d => xScale(parseDate(d.date)))
            .y(d => yScale(d.Employed));

        vis.chart.append("path")
            .datum(aggregatedArray)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        vis.chart.append("path")
            .datum(aggregatedArray)
            .attr("fill", "none")
            .attr("stroke", "orange")
            .attr("stroke-width", 2)
            .attr("d", line2);

        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        vis.chart.append("g")
            .attr("transform", `translate(0, ${vis.height})`)
            .call(xAxis);

        vis.chart.append("g")
            .call(yAxis);

        vis.chart.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height + vis.config.margin.top + 30})`)
            .text("Year");

        vis.chart.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${-vis.config.margin.left + 40}, ${vis.height / 2}) rotate(-90)`)
            .text("Count of people");

    }

}




