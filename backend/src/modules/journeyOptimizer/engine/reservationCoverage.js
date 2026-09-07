const normalizeCode = (value) =>
    String(value || "").trim().toUpperCase();

const getStationOrder = (graph, stationCode) => {
    const code = normalizeCode(stationCode);

    const node = (graph.nodes || []).find(
        (node) => normalizeCode(node.code) === code
    );

    if (!node) {
        return null;
    }

    const order = Number(node.order);

    return Number.isFinite(order) ? order : null;
};

const getEdgeOrders = (graph, edge) => {
    const fromOrder = getStationOrder(
        graph,
        edge.from
    );

    const toOrder = getStationOrder(
        graph,
        edge.to
    );

    if (
        fromOrder === null ||
        toOrder === null
    ) {
        return null;
    }

    return {
        fromOrder,
        toOrder
    };
};

const edgeCoversSegment = (
    graph,
    edge,
    segmentFrom,
    segmentTo
) => {
    const orders = getEdgeOrders(
        graph,
        edge
    );

    const fromOrder = getStationOrder(
        graph,
        segmentFrom
    );

    const toOrder = getStationOrder(
        graph,
        segmentTo
    );

    if (
        !orders ||
        fromOrder === null ||
        toOrder === null
    ) {
        return false;
    }

    return (
        orders.fromOrder <= fromOrder &&
        orders.toOrder >= toOrder
    );
};

const edgeCoversJourney = (
    graph,
    edge,
    source,
    destination
) => {
    return edgeCoversSegment(
        graph,
        edge,
        source,
        destination
    );
};

module.exports = {
    normalizeCode,
    getStationOrder,
    getEdgeOrders,
    edgeCoversSegment,
    edgeCoversJourney
};