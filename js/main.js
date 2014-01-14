(function() {
  var H, W, collide, init;

  W = 800;

  H = 500;

  d3.json("data/country-coords.json", function(coords) {
    return d3.json("data/world-110m.json", function(world) {
      return init(coords, world);
    });
  });

  init = function(coords, world) {
    var NUM_ITERATIONS, c, circle, countries, countryShapes, dataLayer, graticule, map, num, path, projection, q, vis, x, _i, _j, _k, _len, _len1, _ref;
    vis = d3.select("body").append("svg");
    vis.attr({
      width: W,
      height: H
    });
    countries = (function() {
      var _i, _len, _ref, _results;
      _ref = coords.features;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        _results.push({
          name: x.id,
          lat: x.properties.geo_latitude,
          lon: x.properties.geo_longitude,
          value: Math.random()
        });
      }
      return _results;
    })();
    projection = d3.geo.robinson().translate([360, 180]).scale(100);
    path = d3.geo.path().projection(projection);
    graticule = d3.geo.graticule();
    map = vis.append("g").classed("worldmap", true);
    map.append("path").datum(graticule).classed("graticule", true).attr("d", path);
    map.append("path").datum(graticule.outline).classed("graticule outline", true).attr("d", path);
    countryShapes = topojson.object(world, world.objects.countries).geometries;
    map.selectAll(".country").data(countryShapes).enter().insert("path", ".graticule").classed("country", true).attr("d", path);
    dataLayer = vis.append("g").classed("mapDataLayer", true);
    for (_i = 0, _len = countries.length; _i < _len; _i++) {
      c = countries[_i];
      c.radius = c.value * 10;
      _ref = projection([c.lon, c.lat]), c.targetX = _ref[0], c.targetY = _ref[1];
      c.x = c.targetX;
      c.y = c.targetY;
    }
    NUM_ITERATIONS = 50;
    for (num = _j = NUM_ITERATIONS; NUM_ITERATIONS <= 0 ? _j <= 0 : _j >= 0; num = NUM_ITERATIONS <= 0 ? ++_j : --_j) {
      q = d3.geom.quadtree(countries);
      for (_k = 0, _len1 = countries.length; _k < _len1; _k++) {
        c = countries[_k];
        c.x += (c.targetX - c.x) * .1 * (num / NUM_ITERATIONS);
        c.y += (c.targetY - c.y) * .1 * (num / NUM_ITERATIONS);
        q.visit(collide(c));
      }
    }
    c = dataLayer.selectAll("g.countryMark").data(countries).enter().append("g").attr("transform", function(d, i) {
      return "translate(" + d.x + "," + d.y + ")";
    }).attr("title", function(d, i) {
      return d.name;
    });
    return circle = c.append("circle").attr("r", function(d, i) {
      return d.radius;
    });
  };

  collide = function(n) {
    var nx1, nx2, ny1, ny2, r;
    r = n.radius + 16;
    nx1 = n.x - r;
    nx2 = n.x + r;
    ny1 = n.y - r;
    ny2 = n.y + r;
    return function(quad, x1, y1, x2, y2) {
      var l, x, y;
      if (quad.point && quad.point !== n) {
        x = n.x - quad.point.x;
        y = n.y - quad.point.y;
        l = Math.sqrt(x * x + y * y);
        r = n.radius + quad.point.radius;
        if (l < r) {
          l = (l - r) / l * .5;
          n.x -= x *= l;
          n.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
  };

}).call(this);
