// Rendering visualization

Template.viz.onRendered(function() {
  console.log("rendering viz!")

  // reactive operation
  this.autorun(buildChart)

  // Create visualization from: http://bl.ocks.org/jose187/4733747
  function buildChart() {

    var data = Session.get("json")

    if (typeof(data) == 'undefined')
      return // not yet ready

    var width = 900,
        height = 500

    $("#viz").empty() // destroy old graph

    var svg = d3.select("#viz").append("svg")
        .attr("width", width)
        .attr("height", height);

    var force = d3.layout.force()
        .gravity(.1)
        .distance(100)
        .charge(function(d, i) { return i==0 ? -1000: -500 })
        .size([width, height]);

    force
        .nodes(data.nodes)
        .links(data.links)
        .start();

    var link = svg.selectAll(".link")
        .data(data.links)
      .enter().append("line")
        .attr("class", "link")
      .style("stroke-width", function(d) { return Math.sqrt(d.weight); });

    var node = svg.selectAll(".node")
        .data(data.nodes)
      .enter().append("g")
        .attr("class", "node")
        .call(force.drag);

    node.append("circle")
        .attr("r", "10")
        .attr("fill", function(d) { return '#' + d.color });

    node.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(function(d) { return d.name });

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
  }
})
