"use strict";

/*
 * Normalize station / class / coach codes.
 */
const normalizeCode = (value) =>
    String(value || "")
        .trim()
        .toUpperCase();

/*
 * Get the route order of a station from the graph.
 *
 * Example:
 * SC  -> 17
 * BZA -> 23
 * BBSN -> 44
 */
const getStationOrder = (graph, stationCode) => {
    const code = normalizeCode(stationCode);

    const node = (graph.nodes || []).find(
        (node) =>
            normalizeCode(node.code) === code
    );

    if (!node) {
        return null;
    }

    const order = Number(node.order);

    return Number.isFinite(order)
        ? order
        : null;
};

/*
 * Get route orders for an edge.
 *
 * Example:
 * SC -> BBSN
 *
 * returns:
 * {
 *   fromOrder: 17,
 *   toOrder: 44
 * }
 */
const getEdgeOrders = (graph, edge) => {
    if (!edge) {
        return null;
    }

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

    /*
     * An invalid vacancy interval must never
     * be considered as covering a journey.
     */
    if (fromOrder >= toOrder) {
        return null;
    }

    return {
        fromOrder,
        toOrder,
    };
};

/*
 * Check whether a vacancy edge covers a requested
 * journey segment.
 *
 * Vacancy:
 *   SC -> BBSN
 *
 * Requested:
 *   SC -> BZA
 *
 * Since:
 *   SC = 17
 *   BZA = 23
 *   BBSN = 44
 *
 * The vacancy covers SC -> BZA.
 *
 * But:
 *
 * Vacancy:
 *   TDD -> VSKP
 *
 * Requested:
 *   SC -> BZA
 *
 * does NOT cover it.
 */
const edgeCoversSegment = (
    graph,
    edge,
    segmentFrom,
    segmentTo
) => {
    if (!graph || !edge) {
        return false;
    }

    const orders = getEdgeOrders(
        graph,
        edge
    );

    if (!orders) {
        return false;
    }

    const fromOrder = getStationOrder(
        graph,
        segmentFrom
    );

    const toOrder = getStationOrder(
        graph,
        segmentTo
    );

    if (
        fromOrder === null ||
        toOrder === null
    ) {
        return false;
    }

    /*
     * Passenger's source must occur before
     * passenger's destination.
     */
    if (fromOrder >= toOrder) {
        return false;
    }

    /*
     * Vacancy must start at or before the
     * passenger's source AND finish at or
     * after the passenger's destination.
     */
    return (
        orders.fromOrder <= fromOrder &&
        orders.toOrder >= toOrder
    );
};

/*
 * Check whether an edge covers the complete
 * requested journey.
 */
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
    edgeCoversJourney,
};