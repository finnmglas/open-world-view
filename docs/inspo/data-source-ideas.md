# datasources

## gpt generated thought

prompt: you want to create a very long very tight list of possible datasources and apis / osint ways that can be used or integrated in a open world viewer that shows the globe in 3d and vizualises like a cia intelligence panel everything real time and past geospatial

response:

Start with the constraint: “real-time global + historical + geospatial” is not one dataset, it’s a lattice. You’re stitching satellites, sensors, infrastructure exhaust, and human systems. Precision varies wildly; treat everything as probabilistic layers.

Base layer (earth + imagery + elevation)

* Mapbox, Google Maps Platform, HERE Maps, Cesium ion
* Sentinel Hub (Copernicus), Landsat (USGS EarthExplorer API)
* NASA Worldview / GIBS
* Planet Labs (high cadence, paid)
* Maxar (very high resolution, paid)
* OpenAerialMap
* OpenTopography (DEM)
* SRTM, ASTER GDEM
* Copernicus DEM
* OpenStreetMap (Overpass API, planet dumps)
* Natural Earth (static but clean baselines)

Real-time / near real-time satellite & space

* Space-Track.org (TLEs, orbital objects)
* Celestrak
* SatNOGS network
* NOAA GOES imagery (real-time weather satellites)
* EUMETSAT data services
* NASA FIRMS (fires)
* GHGSat (methane, paid)
* Sentinel-1/2/3 live feeds via Copernicus APIs
* BlackSky (real-time tasking, paid)

Weather + atmosphere

* OpenWeatherMap (global API)
* NOAA APIs (weather, storms, radar)
* Meteostat
* ECMWF (ERA5, forecasts)
* Windy API (aggregated visual layer)
* AirNow (US air quality)
* IQAir / WAQI (global AQ)
* Copernicus Atmosphere Monitoring Service
* Blitzortung (lightning network)
* RainViewer (radar tiles)

Maritime

* AIS data: MarineTraffic, VesselFinder, AISHub
* Global Fishing Watch
* ExactEarth / Spire (paid high fidelity AIS)
* NOAA nautical datasets
* Port authority open feeds (varies)

Aviation

* ADS-B Exchange (raw, open)
* OpenSky Network
* FlightRadar24 (paid API)
* FlightAware (paid)
* FAA SWIM feeds (US, restricted)
* Eurocontrol feeds

Ground transportation

* GTFS feeds (public transit worldwide)
* Uber Movement (aggregated mobility)
* Google Traffic layer (visual, not raw)
* TomTom Traffic API
* Waze for Cities (limited access)
* OpenTraffic (historical)

Telecom / connectivity

* Ookla Speedtest Intelligence (paid)
* OpenCellID (cell towers)
* Mozilla Location Service
* Cloudflare Radar (internet traffic trends)
* RIPE Atlas (network measurements)
* BGPStream (routing events)
* IODA (internet outages)

Energy / infrastructure

* ENTSO-E (European grid)
* EIA (US energy)
* Open Power System Data
* Global Power Plant Database (WRI)
* Live grid frequency (various national APIs)
* TankerTrackers (oil flows)
* Genscape / Kpler (paid commodities intelligence)
* OpenInfraMap

Economic / shipping / trade

* UN Comtrade
* World Bank APIs
* IMF datasets
* ImportGenius / Panjiva (paid trade data)
* Baltic Dry Index (shipping cost proxy)
* AIS-derived port congestion (via maritime APIs)

Population / human geography

* WorldPop
* LandScan (paid)
* Meta Data for Good (mobility, population density)
* Google Community Mobility Reports
* Census APIs (US, EU, etc.)

Conflict / security / incidents

* ACLED (armed conflict data)
* GDELT (global event database, near real-time)
* ICEWS (historical political events)
* ReliefWeb (UN OCHA)
* LiveUAMap (aggregated conflicts)
* Gun Violence Archive (US)
* Police/fire scanner feeds (fragmented, local)

Cyber / digital threats

* Shodan
* Censys
* GreyNoise
* AbuseIPDB
* VirusTotal (limited API)
* Shadowserver
* Spamhaus
* Have I Been Pwned (breach metadata)
* BGP hijack feeds (MANRS, etc.)

Environmental / disasters

* USGS Earthquake API
* EMSC earthquakes
* GDACS (global disaster alerts)
* Copernicus EMS
* Global Flood Monitoring System
* Drought Monitor (various regions)
* NASA Earthdata
* Global Forest Watch (deforestation)
* FIRMS (again for fires, critical)

Urban / IoT / sensors

* Smart city open data portals (city-specific)
* Things Network (LoRaWAN)
* Sensor.Community (air quality DIY sensors)
* OpenSenseMap
* Traffic camera feeds (varies heavily)
* Environmental sensor APIs (noise, pollution)

Social / OSINT human signals

* X/Twitter API (restricted but still useful)
* Reddit (Pushshift historical, official API limited)
* Telegram public channels (scraping)
* YouTube live / geotagged content
* Flickr geotagged images
* CrisisNLP datasets
* News APIs (NewsAPI, GDELT again)

Dark web / fringe (handle carefully)

* Tor indexers (Ahmia)
* DarkOwl (paid)
* Recorded Future (paid intel)

Geopolitical / boundaries

* OSM boundaries
* GADM
* UN Geospatial datasets
* Natural Earth admin layers

Time-series / historical archives

* Wayback Machine (not geospatial native but useful)
* Google Earth Engine (massive historical raster compute)
* AWS Open Data Registry (tons of geospatial archives)
* Azure Open Datasets

Financial / market proxies (geo-linked)

* Stock exchanges APIs
* Crypto on-chain data (Glassnode, Dune)
* Real estate datasets (Zillow, etc. region-specific)

Health

* WHO datasets
* CDC APIs
* ECDC
* Johns Hopkins (archived COVID but pattern useful)

Integration / processing layer (critical)

* PostGIS
* BigQuery GIS
* Snowflake geospatial
* Apache Sedona
* Deck.gl / Kepler.gl
* CesiumJS (for the 3D globe core)
* Kafka (stream ingestion)
* Temporal + vector tiling (MVT, 3D tiles)

OSINT techniques (not just APIs)

* Satellite tasking + change detection (diffing imagery over time)
* AIS spoofing detection via path anomalies
* ADS-B multilateration + ghost flight detection
* Shadow analysis for timestamp validation
* Weather correlation (validate video/photo claims)
* Cross-platform event correlation (GDELT + social + sensors)
* Geolocation via terrain matching (manual/ML hybrid)
* Network outage triangulation (BGP + user reports)
* Supply chain inference (port + AIS + customs leaks)
* Pattern-of-life modeling (mobility + lights + traffic)
* Thermal anomaly tracking (fires, industrial activity)
* Night lights (VIIRS) for economic activity shifts

What matters is not listing more. It’s fusion:

* everything time-indexed
* everything spatially normalized
* confidence score per datapoint
* conflict resolution between sources
* latency tagging (real-time vs delayed vs historical)
* provenance preserved (you will need it)

If you try to make it “CIA-like” without uncertainty modeling, you build a toy.

Next step: decide your first vertical slice. Military, climate, logistics, or cyber. Pick one and go deep, not wide.
