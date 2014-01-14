W = 800
H = 500

d3.json "data/country-coords.json", (coords) ->
	d3.json "data/world-110m.json", (world) ->
		init(coords, world)

init = (coords, world)->
	vis = d3.select("body").append("svg")

	vis.attr(
		width: W
		height: H
	)

	countries = ({
		name: x.id
		lat: x.properties.geo_latitude
		lon: x.properties.geo_longitude
		value: Math.random()
	} for x in coords.features)

	# generate map

	projection = d3.geo.robinson().translate([360,180]).scale(100)
	path = d3.geo.path().projection(projection)
	graticule = d3.geo.graticule()

	map = vis.
		append("g").classed("worldmap", true)

	map.append("path")
		.datum(graticule) 
		.classed("graticule", true) 
		.attr("d", path)

	map.append("path")
		.datum(graticule.outline)
		.classed("graticule outline", true)
		.attr("d", path)

	countryShapes = topojson.object(world, world.objects.countries).geometries
	map.selectAll(".country")
		.data(countryShapes)
	.enter().insert("path", ".graticule")
		.classed("country", true)
		.attr("d", path)

	# generate bubbles

	dataLayer = vis
		.append("g").classed("mapDataLayer", true)

	for c in countries
		c.radius = c.value * 10
		# desired screen positions
		[c.targetX, c.targetY] = projection([c.lon, c.lat])

		# actual screen positions
		c.x = c.targetX
		c.y = c.targetY

	# optimize layout
	NUM_ITERATIONS = 50

	for num in [NUM_ITERATIONS..0]
		# recalc quadtree
		q = d3.geom.quadtree(countries)

		for c in countries
			# move each country closer to target point, but with decreasing strength
			c.x += (c.targetX - c.x) * .1 * (num/NUM_ITERATIONS)
			c.y += (c.targetY - c.y) * .1 * (num/NUM_ITERATIONS)

			# fix overlaps
			q.visit(collide(c))	

	# fix overlaps
	c = dataLayer
		.selectAll("g.countryMark")
		.data(countries)
	.enter()
		.append("g")
		.attr("transform", (d,i) ->
			"translate(#{d.x},#{d.y})"
		)
		.attr("title", (d,i) -> 
			d.name
		)

	# draw country circles
	circle = c
		.append("circle")
		.attr("r", (d,i) ->
			d.radius
		)

# helper function to push circles apart in case they overlap
collide = (n) ->
	r = n.radius + 16
	nx1 = n.x - r
	nx2 = n.x + r
	ny1 = n.y - r
	ny2 = n.y + r
	(quad, x1, y1, x2, y2) ->
		if quad.point and quad.point isnt n
			x = n.x - quad.point.x
			y = n.y - quad.point.y
			l = Math.sqrt(x * x + y * y)
			r = n.radius + quad.point.radius
			if l < r
				l = (l - r) / l * .5
				n.x -= x *= l
				n.y -= y *= l
				quad.point.x += x
				quad.point.y += y
	
		x1 > nx2 or x2 < nx1 or y1 > ny2 or y2 < ny1
