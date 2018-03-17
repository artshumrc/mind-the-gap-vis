$( document ).ready(function() {
/** Snippets and inspiration from http://bl.ocks.org/andreaskoller/7674031, https://bl.ocks.org/martinjc/7aa53c7bf3e411238ac8aef280bd6581, and http://bl.ocks.org/eyaler/10586116 **/
var margin = {
  top:50,
  bottom:50,
  right:100,
  left:100
};
var graphDiv = document.getElementById("graph-vis");
var svg = d3.select(graphDiv).append("svg");
var width = graphDiv.clientWidth;
var height = graphDiv.clientHeight;
svg
  .attr("width", width)
  .attr("height", height);

/**
function getData(){
  $.getJSON("http://api.mindthegap.orphe.us/v1?type=interviews", function(data){
    interviews = data;
    console.log(interviews);
    console.log("me");
  });
  $.getJSON("http://api.mindthegap.orphe.us/v1?type=people"), function(data){
    people = data;
    console.log(people);
  };
}
**/
//Need to combine all people and interviews into one list of nodes
//Need to get relationships as edges

var simulation = d3.forceSimulation()
    // pull nodes together based on the links between them
    .force("link", d3.forceLink().id(function(d) {
        return d.id;
    })
    .strength(0.025))
    // push nodes apart to space them out
    .force("charge", d3.forceManyBody().strength(-150))
    // add some collision detection so they don't overlap
    .force("collide", d3.forceCollide().radius(12))
    // and draw them around the centre of the space
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("https://api.myjson.com/bins/6v97x", function(error, graph) {
  if(error) throw error;
  //bind nodes and edges
  var nodeData = graph.nodes;
  var linkData = graph.links;
  
  var links = svg.selectAll(".link")
    .data(linkData)
    .enter()
    .append("path")
    .attr("class", "link")
    .style("fill", "none")
    .style('stroke-width', 2);
  var nodes = svg.selectAll(".node")
    .data(nodeData)
    .enter().append("g")
    .attr("class", "node");
  var titles = svg.selectAll(".title")
    .data(nodeData)
    .enter().append("g")
    .attr("class", "title");
  
  nodes.append("path")
    .attr("class", "node")
    .attr("class", function(d){
      return ("node " + d.type);
    })
    .attr("d", d3.symbol()
         .type(d3.symbolHexagon)
         .size(function(d){
          var scaling = 25;
          if('size' in d){
            return(d.size * scaling)
          } else {
            return scaling > 0 ? scaling : 1;
          }
         })
     )
     .on("mouseover", mouseOver)
     .on("mouseout", mouseOut)
     .on("dblclick", nodeDblClicked)
     .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
  
  var rectWidthPad = 10;
  var rectHeightPad = 5;
  
  var titleText = titles.append("text")
    .attr("dy", 16)
    .attr("dx", (rectWidthPad/2))
    .text(function(d) { return d.id })
    .attr("class","titleText")
    .style("opacity", 0)
    .on("mouseover", mouseOver)
    .on("mouseout", mouseOut)
    .on("dblclick", nodeDblClicked);
  
  titleText.each(function(d){
    d.bb = this.getBBox();
    console.log(d);
  });
  
  var titleRects = titles.append("rect")
    .attr("width", function(d){
      return d.bb.width + rectWidthPad;
    })
    .attr("height", function(d){
      console.log(d.bb.height);
      return d.bb.height + rectHeightPad;
    })
    .attr("rx", 5)
    .attr("ry", 5)
    .style("fill", "#4a4a4a")
    .style("stroke", "#ffffff")
    .attr("class", "titleRect")
    .style("opacity", 0)
    .on("mouseover", mouseOver)
    .on("mouseout", mouseOut)
    .on("dblclick", nodeDblClicked)
    .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
  
  simulation
    .nodes(nodeData)
    .on("tick", ticked);
  simulation
    .force("link")
    .links(linkData);

  function ticked() {
    links.attr("d", positionLink);
    nodes.attr("transform", positionNode);
    titles.attr("transform", positionTitle)
  }
  
  
function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
  
// links are drawn as curved paths between nodes, through the intermediate nodes
function positionLink(d) {
  var offset = 100;
  var midpoint_x = (d.source.x + d.target.x) / 2;
  var midpoint_y = (d.source.y + d.target.y) / 2;
  var dx = (d.target.x - d.source.x);
  var dy = (d.target.y - d.source.y);
  var normalise = Math.sqrt((dx * dx) + (dy * dy));
  var offSetX = midpoint_x + offset*(dy/normalise);
  var offSetY = midpoint_y - offset*(dx/normalise);
  
  return "M" + d.source.x + "," + d.source.y + "S" + offSetX + "," + offSetY + " " + d.target.x + "," + d.target.y;
}

  function positionNode(d) {
    // keep the node within the boundaries of the svg
    if (d.x < 0) {
      d.x = 0
    };
    if (d.y < 0) {
      d.y = 0
    };
    if (d.x > width) {
      d.x = width
    };
    if (d.y > height) {
      d.y = height
    };
    return "translate(" + d.x + "," + d.y + ")";
  }
  
  function positionTitle(d) {
    if (d.x < 0) {
      d.x = 0
    };
    if (d.y < 0) {
      d.y = 0
    };
    if (d.x > width) {
      d.x = width
    };
    if (d.y > height) {
      d.y = height
    };
    return "translate(" + (d.x - ((d.bb.width + rectWidthPad)/ 2)) + "," + (d.y - ((d.bb.height + rectHeightPad)/ 2)) + ")";
  }
  
  var linksIndex = {};
  linkData.forEach(function(d){
    linksIndex[d.source.index + "," + d.target.index] = true;
    linksIndex[d.source.index + "," + d.source.index] = true;
    linksIndex[d.target.index + "," + d.target.index] = true;
  });
  function isConnected(a,b){
    return linksIndex[a.index + "," + b.index] || linksIndex[b.index + "," + a.index];
  }
  function mouseOver(d){
    nodes.style("fill-opacity", function(o){
        return isConnected(o,d) ? 1 : 0.1;
    });
    nodes.style("stroke-opacity", function(o){
        return isConnected(o,d) ? 1 : 0.1;
    });
    links.style("stroke-opacity", function(o){
        return o.source === d || o.target === d ? 1 : 0.1;
    });
    titleText.style("opacity", function(o){
      return isConnected(o,d) ? 1 : 0;
    });
    titleRects.style("opacity", function(o){
      return isConnected(o,d) ? 1 : 0;
    });
    
    svg.selectAll("g.title").each(function(){
      this.childNodes.forEach(function(n){
        if(n.getAttribute("class") == "titleText"){
          n.parentNode.appendChild(n);
        }
      })
    });
  }
  function mouseOut(){
    nodes.style("stroke-opacity", 1);
    nodes.style("fill-opacity", 1);
    links.style("stroke-opacity", 1);
    titleText.style("opacity", 0);
    titleRects.style("opacity", 0);
  }
  //Toggle modal based on ID
  function nodeDblClicked(d){
    console.log(d);
    $(".orpheusModal").show();
    $("#data").html(JSON.stringify(d));
  }
  function closeModal() {
    $(".orpheusModal").hide();
  }
  $(".closeModal").click(closeModal);
});
});
