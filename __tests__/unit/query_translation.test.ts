import { OhmInterpreter } from "../../src/libs/engine/query_interpreter";
import { InputNode } from "../../src/libs/model/input_descriptor/input_node.class";
import { InputRelationship } from "../../src/libs/model/input_descriptor/input_relationship.class";
import { validateQueryChain } from "./utils/validateQueryChain";
import { QueryDescriptor } from "../../src/libs/model/query_descriptor/query_descriptor.class";
import { validateQueryDescriptor } from "./utils/validateQueryDescriptor";
import { QueryTriple } from "../../src/libs/model/query_descriptor/query_triple.class";
import { QueryNode } from "../../src/libs/model/query_descriptor/query_node.class";
import { QueryRelationship } from "../../src/libs/model/query_descriptor/query_relationship.class";

describe("Simple Query Translation", () => {
  describe("Basic Query Construction", () => {
    it("Described Node", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor("?('name')");

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("IDENTIFIED_NODE", "", [], "name"),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(queryDescriptor.isComplexQuery()).toBeFalsy();
      expect(queryDescriptor.queryFilter.types.length).toBe(0);
      expect(queryDescriptor.queryFilter.searchTerm).toBe("name");

      done();
    });

    it("Described Node / Typed Node", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?('mongod':software)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("DESCRIBED_NODE", "", ["software"], "mongod"),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(queryDescriptor.isComplexQuery()).toBeFalsy();
      expect(queryDescriptor.queryFilter.types).toContain("software");
      expect(queryDescriptor.queryFilter.searchTerm).toBe("mongod");

      done();
    });

    it("Described Node / Typed Node with Multiple Types", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?('mongod':software or node or artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode(
            "DESCRIBED_NODE",
            "",
            ["software", "node", "artifact"],
            "mongod"
          ),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(queryDescriptor.isComplexQuery()).toBeFalsy();
      expect(queryDescriptor.queryFilter.types).toContain("software");
      expect(queryDescriptor.queryFilter.types).toContain("node");
      expect(queryDescriptor.queryFilter.types).toContain("artifact");
      expect(queryDescriptor.queryFilter.searchTerm).toBe("mongod");

      done();
    });

    it("Typed Node", (done) => {
      const inputDescriptor =
        OhmInterpreter.mountInputDescriptor("?(software)");

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["software"], ""),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(queryDescriptor.isComplexQuery()).toBeFalsy();
      expect(queryDescriptor.queryFilter.types).toContain("software");
      expect(queryDescriptor.queryFilter.searchTerm).toBe("");

      done();
    });

    it("Typed Node with Multiple Types", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(software or node)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["software", "node"], ""),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(queryDescriptor.isComplexQuery()).toBeFalsy();
      expect(queryDescriptor.queryFilter.types).toContain("software");
      expect(queryDescriptor.queryFilter.types).toContain("node");
      expect(queryDescriptor.queryFilter.searchTerm).toBe("");

      done();
    });

    it("Typed Node - With Space Before and After", (done) => {
      const inputDescriptor =
        OhmInterpreter.mountInputDescriptor("    ?(artifact)  ");

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(queryDescriptor.isComplexQuery()).toBeFalsy();
      expect(queryDescriptor.queryFilter.types).toContain("artifact");
      expect(queryDescriptor.queryFilter.searchTerm).toBe("");

      done();
    });
  });

  describe("Bad Query Construction", () => {
    it("Should Return Error - Empty Query", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Nested Node", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?((artifact)))");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Invalid Nodes Positioning", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(artifact)(node)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Invalid Relationship", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(artifact)(node)->");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Group Node Alone", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(*)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Not Described Node Alone", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?()");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Not starting with Not Described Node", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?()<=[serving]=(component)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Not starting with Inclusive Node", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(*)<=[serving]=(component)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Bidirectional bound relationship", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(software)-(server)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Bidirectional bound relationship (Variant)", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(software)<->(server)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Bidirectional bound relationship with type", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(software)-[type]-(server)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Bidirectional bound relationship with type (Variant)", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(software)<-[type]->(server)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Bidirectional path relationship", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(software)=(server)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Bidirectional path relationship (Variant)", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(software)<=>(server)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Bidirectional path relationship with type", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(software)=[type]=(server)");
      }).toThrow("Invalid query");

      done();
    });

    it("Should Return Error - Bidirectional path relationship with type (Variant)", (done) => {
      expect(function () {
        OhmInterpreter.mountInputDescriptor("?(software)<=[type]=>(server)");
      }).toThrow("Invalid query");

      done();
    });
  });

  describe("Relationship Construction", () => {
    it("Short Relationship ->", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)->(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "SHORT_RELATIONSHIP",
            "BONDED_BASE",
            "BONDED_RIGHT",
            "",
            [],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      done();
    });

    it("Short Relationship <-", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)<-(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "SHORT_RELATIONSHIP",
            "BONDED_LEFT",
            "BONDED_BASE",
            "",
            [],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      done();
    });

    it("Bonded Relationship ->", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)-[assignment]->(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "TYPED_RELATIONSHIP",
            "BONDED_BASE",
            "BONDED_RIGHT",
            "",
            ["assignment"],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      done();
    });

    it("Bonded Relationship <-", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)<-[assignment]-(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "TYPED_RELATIONSHIP",
            "BONDED_LEFT",
            "BONDED_BASE",
            "",
            ["assignment"],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      done();
    });

    it("Path Relationship ->", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)=[assignment]=>(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "TYPED_RELATIONSHIP",
            "PATH_BASE",
            "PATH_RIGHT",
            "",
            ["assignment"],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      done();
    });

    it("Path Relationship <-", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)<=[assignment]=(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "TYPED_RELATIONSHIP",
            "PATH_LEFT",
            "PATH_BASE",
            "",
            ["assignment"],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      done();
    });
  });

  describe("Bidirectional Construction", () => {
    it("Short Bidirectional Relationship <->", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)<->(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "SHORT_RELATIONSHIP",
            "BONDED_LEFT",
            "BONDED_RIGHT",
            "",
            [],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(
        validateQueryDescriptor(queryDescriptor, [
          new QueryTriple(
            new QueryNode(["node"], "", []),
            new QueryRelationship([], 0, false, false),
            new QueryNode(["artifact"], "", [])
          ),
        ])
      ).toBeTruthy();

      done();
    });

    it("Bonded Bidirectional Relationship <-[type]->", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)<-[assignment]->(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "TYPED_RELATIONSHIP",
            "BONDED_LEFT",
            "BONDED_RIGHT",
            "",
            ["assignment"],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(
        validateQueryDescriptor(queryDescriptor, [
          new QueryTriple(
            new QueryNode(["node"], "", []),
            new QueryRelationship(["assignment"], 0, false, false),
            new QueryNode(["artifact"], "", [])
          ),
        ])
      ).toBeTruthy();

      done();
    });

    it("Path Bidirectional Relationship <=[type]=>", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)<=[realization]=>(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "TYPED_RELATIONSHIP",
            "PATH_LEFT",
            "PATH_RIGHT",
            "",
            ["realization"],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(
        validateQueryDescriptor(queryDescriptor, [
          new QueryTriple(
            new QueryNode(["node"], "", []),
            new QueryRelationship(["realization"], 0, false, true),
            new QueryNode(["artifact"], "", [])
          ),
        ])
      ).toBeTruthy();

      done();
    });

    it("Bonded Bidirectional Relationship -", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)-[assignment]-(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "TYPED_RELATIONSHIP",
            "BONDED_BASE",
            "BONDED_BASE",
            "",
            ["assignment"],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(
        validateQueryDescriptor(queryDescriptor, [
          new QueryTriple(
            new QueryNode(["node"], "", []),
            new QueryRelationship(["assignment"], 0, false, false),
            new QueryNode(["artifact"], "", [])
          ),
        ])
      ).toBeTruthy();

      done();
    });

    it("Short Relationship -", (done) => {
      const inputDescriptor =
        OhmInterpreter.mountInputDescriptor("?(node)-(artifact)");

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "SHORT_RELATIONSHIP",
            "BONDED_BASE",
            "BONDED_BASE",
            "",
            [],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(
        validateQueryDescriptor(queryDescriptor, [
          new QueryTriple(
            new QueryNode(["node"], "", []),
            new QueryRelationship(["assignment"], 0, false, false),
            new QueryNode(["artifact"], "", [])
          ),
        ])
      ).toBeTruthy();

      done();
    });

    it("Path Relationship ==", (done) => {
      const inputDescriptor = OhmInterpreter.mountInputDescriptor(
        "?(node)=[assignment]=(artifact)"
      );

      expect(
        validateQueryChain(inputDescriptor, [
          new InputNode("TYPED_NODE", "", ["node"], ""),
          new InputRelationship(
            "TYPED_RELATIONSHIP",
            "PATH_BASE",
            "PATH_BASE",
            "",
            ["assignment"],
            false
          ),
          new InputNode("TYPED_NODE", "", ["artifact"], ""),
        ])
      ).toBeTruthy();

      const queryDescriptor: QueryDescriptor =
        inputDescriptor.generateQueryDescriptor();

      expect(
        validateQueryDescriptor(queryDescriptor, [
          new QueryTriple(
            new QueryNode(["node"], "", []),
            new QueryRelationship(["assignment"], 0, false, true),
            new QueryNode(["artifact"], "", [])
          ),
        ])
      ).toBeTruthy();

      done();
    });
  });
});
