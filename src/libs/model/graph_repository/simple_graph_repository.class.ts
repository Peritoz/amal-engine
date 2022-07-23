import {
  GraphVertex,
  GraphEdge,
  GraphRepository,
  VertexFilter,
  EdgeFilter,
} from "@libs/model/graph_repository/graph_repository.interface";

export class SimpleGraphRepository implements GraphRepository {
  protected _adjacencyListMap: Map<string, Array<string>>;
  protected _verticesArray: Array<GraphVertex>;
  protected _verticesMap: Map<string, GraphVertex>;
  protected _verticesMapByType: Map<string, Array<string>>;
  protected _edges: Map<string, GraphEdge>;

  constructor() {
    this._adjacencyListMap = new Map<string, Array<string>>();
    this._verticesArray = [];
    this._verticesMap = new Map<string, GraphVertex>();
    this._verticesMapByType = new Map<string, Array<string>>();
    this._edges = new Map<string, GraphEdge>();
  }

  addVertex(vertex: GraphVertex): void {
    this._adjacencyListMap.set(vertex.id, []);
    this._verticesArray.push(vertex); // TODO: Sorted insertion for optimal search
    this._verticesMap.set(vertex.id, vertex);

    // Mapping by type for filter optimization
    for (let i = 0; i < vertex.types.length; i++) {
      const type = vertex.types[i];
      const typeEntry = this._verticesMapByType.get(type);

      if (typeEntry) {
        typeEntry.push(vertex.id);
      } else {
        this._verticesMapByType.set(type, [vertex.id]);
      }
    }
  }

  addEdge(edge: GraphEdge): void {
    const adjListElements = this._adjacencyListMap.get(edge.sourceId);

    for (let i = 0; i < edge.types.length; i++) {
      const edgeType = edge.types[i];
      const adjListElement = `${edgeType}>${edge.targetId}`;
      const relId = `${edge.sourceId}>${adjListElement}`;

      if (Array.isArray(adjListElements)) {
        if (!adjListElements.includes(adjListElement)) {
          adjListElements.push(adjListElement);
          this._edges.set(relId, edge);
        }
      } else {
        this._adjacencyListMap.set(edge.sourceId, [adjListElement]);
        this._edges.set(relId, edge);
      }
    }
  }

  getVertex(vertexId: string): Promise<GraphVertex | undefined> {
    return Promise.resolve(this._verticesMap.get(vertexId));
  }

  getAllVertices(): Promise<Array<GraphVertex>> {
    return Promise.resolve(this._verticesArray);
  }

  getVertices(vertexIds: Array<string>): Promise<Array<GraphVertex>> {
    const vertices = [];

    for (let i = 0; i < vertexIds.length; i++) {
      const vertex = this._verticesMap.get(vertexIds[i]);

      if (vertex) {
        vertices.push(vertex);
      }
    }

    return Promise.resolve(vertices);
  }

  getVerticesByFilter(filter: VertexFilter): Promise<Array<GraphVertex>> {
    let candidates = [];

    // Filtering vertices by ID
    if (Array.isArray(filter.ids) && filter.ids.length > 0) {
      for (let i = 0; i < filter.ids.length; i++) {
        const id = filter.ids[i];
        const vertex = this._verticesMap.get(id);

        if (vertex) {
          candidates.push(vertex);
        }
      }
    }

    // Filtering vertices by TYPE
    if (Array.isArray(filter.types) && filter.types.length > 0) {
      // First case: Some candidate vertices were selected
      if (candidates.length > 0) {
        candidates = candidates.filter((candidate) =>
          candidate.types.some((t) => filter.types?.includes(t))
        );
      } else {
        // Second case: There are no candidates available
        let verticesIds: Array<string> = [];

        // Getting all vertices ids based on filter types
        for (let i = 0; i < filter.types.length; i++) {
          const type = filter.types[i];
          const idsForType = this._verticesMapByType.get(type);

          if (idsForType) {
            verticesIds = [...verticesIds, ...idsForType];
          }
        }

        // Removing duplicated values
        verticesIds = [...new Set(verticesIds)];

        // Getting vertices metadata
        for (let i = 0; i < verticesIds.length; i++) {
          const id = verticesIds[i];
          const vertex = this._verticesMap.get(id);

          if (vertex) {
            candidates.push(vertex);
          }
        }
      }
    }

    // Filtering vertices by NAME
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();

      // First case: Some candidate vertices were selected
      if (candidates.length > 0) {
        candidates = candidates.filter((candidate) =>
          candidate.name.toLowerCase().includes(searchTerm)
        );
      } else {
        // Second case: There are no candidates available
        candidates = this._verticesArray.filter((candidate) =>
          candidate.name.toLowerCase().includes(searchTerm)
        );
      }
    }

    return Promise.resolve(candidates);
  }

  getEdge(edgeId: string): Promise<GraphEdge | undefined> {
    return Promise.resolve(this._edges.get(edgeId));
  }

  getAllEdges(): Promise<Array<GraphEdge>> {
    return Promise.resolve(Array.from(this._edges.values()));
  }

  getEdges(edgeIds: Array<string>): Promise<Array<GraphEdge>> {
    const edges = [];

    for (let i = 0; i < edgeIds.length; i++) {
      const edge = this._edges.get(edgeIds[i]);

      if (edge) {
        edges.push(edge);
      }
    }

    return Promise.resolve(edges);
  }

  async getEdgesByFilter(
    sourceFilter: VertexFilter,
    relationshipFilter: EdgeFilter,
    targetFilter: VertexFilter
  ): Promise<Array<GraphEdge>> {
    const sourceVertices = await this.getVerticesByFilter(sourceFilter);
    const targetVertices = await this.getVerticesByFilter(targetFilter);
    const targetIds = targetVertices.map((vertex) => vertex.id);
    const relationships: Array<GraphEdge> = [];

    for (let i = 0; i < sourceVertices.length; i++) {
      const vertex = sourceVertices[i];
      const adjacencyList = this._adjacencyListMap.get(vertex.id);

      if (Array.isArray(adjacencyList)) {
        for (let j = 0; j < adjacencyList.length; j++) {
          const adjListElement = adjacencyList[j]; // Returns: "type>targetId"

          if (targetIds.includes(adjListElement)) {
            const rel = await this.getEdge(`${vertex.id}>${adjListElement}`);

            if (rel) {
              relationships.push(rel);
            }
          }
        }
      }
    }

    return Promise.resolve(relationships);
  }
}
