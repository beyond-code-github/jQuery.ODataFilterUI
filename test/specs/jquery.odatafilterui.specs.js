describe("OData Filter UI", function () {

	var filterControl;

	beforeEach(function () {
		spyOn(ko, "applyBindings").andCallThrough();

		var target = $('<div>', { id: 'target' }).appendTo(document.body);
		$( '<input>', { id: 'filter', type: 'text' } ).appendTo(target);
	});

	afterEach(function () {
		$('#target').remove();
	});

	describe("Plugin activation", function () {

		describe("With defaults", function () {

			var model;
			beforeEach(function () {
				filterControl = $("#filter").oDataFilterUI({});
				model = filterControl.Model;
			});

			it("Should initialise the fields list", function () {
				expect(model.Fields().length).toEqual(0);
			});

		});

		describe("With settings", function () {
			var fields, model;

			describe("Field settings", function () {

				beforeEach(function () {
					fields = [
					{ text: "First Name", value: "FirstName" },
					{ text: "Last Name", value: "LastName" }];

					filterControl = $("#filter").oDataFilterUI({ Fields: fields });
					model = filterControl.Model;
				});

				it("Should initialise the fields list", function () {
					expect(model.Fields()).toEqual(fields);
				});	

			})

			describe("Existing filters", function () {

				beforeEach(function () {
					filterControl = $("#filter").oDataFilterUI({ Fields: fields });
					model = filterControl.Model;
				});

				it("Should initialise the fields list", function () {
					expect(model.Fields()).toEqual(fields);
				});	

			})

			describe("Pre-existing model", function () {

				beforeEach(function () {
					filterControl = $("#filter").oDataFilterUI({ Fields: fields });
					model = filterControl.Model;

					// Now reset UI
					$('#target').remove();
					var target = $('<div>', { id: 'target' }).appendTo(document.body);
					$( '<input>', { id: 'filter', type: 'text' } ).appendTo(target);

					filterControl = $("#filter").oDataFilterUI({ Model: model });
				});

				it("Should use the given model", function () {
					expect(filterControl.Model).toBe(model);
				});	

			})

			describe("Pre-existing model with no rows", function () {

				beforeEach(function () {
					filterControl = $("#filter").oDataFilterUI({ Fields: fields });
					model = filterControl.Model;

					// Now reset UI
					$('#target').remove();
					var target = $('<div>', { id: 'target' }).appendTo(document.body);
					$( '<input>', { id: 'filter', type: 'text' } ).appendTo(target);

					model.FilterRows([]);

					filterControl = $("#filter").oDataFilterUI({ Model: model });
				});

				it("Should let you add new filters", function () {
					container = $("#filter").parent();
					message = $("#filter").next();

					addAnother = message.next();
					addAnother.click();

					row = container.find("ol");

					expect(row.length).toEqual(1);
				});	

			})

		});

		describe("General", function () {

			var model;
			beforeEach(function () {
				filterControl = $("#filter").oDataFilterUI({});
				model = filterControl.Model;
			});

			describe("Creating the Model", function () {

				it("Should set the model property", function () {
					expect(filterControl.Model).toBeTruthy();
				});

				it("Should create the correct properties", function () {
					expect(model.FilterRows).toBeTruthy();
					expect(model.Fields).toBeTruthy();
				});

				it("Should create the correct functions", function () {
					expect(typeof(model.removeFilter)).toEqual("function");
					expect(typeof(model.addAnother)).toEqual("function");
					expect(typeof(model.getODataFilter)).toEqual("function");
				});

				it("Should seed the rows list", function () {
					expect(model.FilterRows()).toBeTruthy();
				});

				it("Should bind the model with knockout", function () {
					expect(ko.applyBindings).toHaveBeenCalledWith(model, filterControl.parent().get(0));
				});

			});

			describe("Creating the UI", function () {

				var container, rowContainer, row, field, operator, value, remove, addAnother;

				it("Should make the textbox into a hidden field", function () {
					expect($("#filter").attr("type")).toEqual("hidden");
				})

				it("Should add a container element", function () {
					container = $("#filter").parent();		
					expect(container.is("div")).toBeTruthy();
				});

				it("Should add a row container element with knockout bindings", function () {
					rowContainer = $("#filter").next();		

					expect(rowContainer.is("div")).toBeTruthy();
					expect(rowContainer.attr("data-bind")).toEqual("foreach: FilterRows");
				});
			});
		});
	});

	describe("Behavior", function () {

		var model, container, rowContainer, row, field, operator, value, remove, addAnother;

		describe("With custom fieldname modifier function", function () {

			beforeEach(function () {
				filterControl = $("#filter").oDataFilterUI(
					{ 
						Fields: [ 
							{ text: "First Name", value: "FirstName", type: "string" },
							{ text: "Tags", value: "Tags", type: "string" }, 
							{ text: "Age", value: "Age", type: "int" },
							{ text: "Is Activated", value: "IsActivated", type: "bool" }],
						fieldNameModifier: function (fieldName) {
							if (fieldName == "Tags") 
							{
								return fieldName;
							}

							return "[" + fieldName + "]"
						}
					});

				model = filterControl.Model;

				container = $("#filter").parent();
				rowContainer = $("#filter").next();
				addAnother = rowContainer.next();

				addAnother.click();
				row = container.find("ol").last();				
				row.find("select.filterField option").filter(function() {
				    return $(this).text() == "First Name"; 
				}).prop('selected', true);
				row.find("select.filterField").change();
				row.find("input.filterValue").val("Pete").change();

				addAnother.click();
				row = container.find("ol").last();				
				row.find("select.filterField option").filter(function() {
				    return $(this).text() == "Tags"; 
				}).prop('selected', true);
				row.find("select.filterField").change();
				row.find("input.filterValue").val("Best Practice").change();

			});

			it("should use the function when building the odata string", function () {
				expect(model.getODataFilter()).toEqual("$filter=[FirstName] eq 'Pete' and Tags eq 'Best Practice'")
			});

		});

		describe("With common settings", function () {

			beforeEach(function () {
				filterControl = $("#filter").oDataFilterUI({ Fields: [ 
					{ text: "First Name", value: "FirstName", type: "string" },
					{ text: "Last Name", value: "LastName", type: "string" }, 
					{ text: "Age", value: "Age", type: "int" },
					{ text: "Is Activated", value: "IsActivated", type: "bool" }]
				});
				model = filterControl.Model;

				container = $("#filter").parent();
				rowContainer = $("#filter").next();
				addAnother = rowContainer.next();
			});

			describe("Clicking the add link", function () {
				
				describe("When there are no rows", function () {

					beforeEach(function() {	
						addAnother.click();
						row = container.find("ol");
					});

					it("Should remove the 'no filters' message", function () {
						var message = container.find("span").first();
						expect(message.length).toEqual(0);
					});

					it("Should the add a blank filter row", function () {
						row = container.find("ol");
						expect(row.length).toEqual(1);
					})

					it("Should populate the filter row with a field drop down in an li", function () {
						field = row.find("select.filterField");
						expect(field.length).toEqual(1);
						expect(field.parent().is("li")).toBeTruthy();
					});

					it("Should populate the filter row with an operator drop down in an li", function () {
						operator = row.find("select.filterOperator");
						expect(operator.length).toEqual(1);
						expect(operator.parent().is("li")).toBeTruthy();
					});

					it("Should populate the filter row with a value field in an li", function () {
						value = row.find("input.filterValue");
						expect(value.length).toEqual(1);
						expect(value.parent().is("li")).toBeTruthy();
					});

					it("Should populate the filter row with a remove link in an li", function () {
						remove = row.find("a.filterRemove");
						expect(remove.length).toEqual(1);
						expect(remove.html()).toEqual("remove");
						expect(remove.parent().is("li")).toBeTruthy();
					});

					it("Should add the button to allow adding new filter rows", function () {
						addAnother = rowContainer.next();
						expect(addAnother.is("a")).toBeTruthy();
						expect(addAnother.html()).toEqual("add");
					});

				});

				describe("When there are existing rows", function () {

					beforeEach(function() {
						addAnother.click();
						addAnother.click();
					});

					it("Should add a new row to the UI", function () {
						row = container.find("ol");
						expect(row.length).toEqual(2);
					})

					it("Should add a new entry to the model", function () {
						expect(model.FilterRows().length).toEqual(2);
					})

				});

			});

			describe("Clicking the remove link", function () {

				var removeButton;
				describe("When there is only one row", function () {

					beforeEach(function() {
						addAnother.click();
						row = container.find("ol").last();
						removeButton = row.find(".filterRemove");
						removeButton.click();
					});

					it("should remove the row from the ui and display a message", function () {
						var message = container.find("span").first();
						expect(message.length).toEqual(1);
						expect(message.html()).toEqual("There are currently no filters applied");
					});

				});

				describe("When there is more than one row", function () {

					beforeEach(function() {
						addAnother.click();
						addAnother.click();

						row = container.find("ol").last();
						removeButton = row.find(".filterRemove");
						removeButton.click();
					});

					it("should remove the row from the ui", function () {
						var rows = container.find("ol");
						expect(rows.length).toEqual(1);
					});

					it("should remove the row from the model", function () {
						var rows = container.find("ol");
						expect(model.FilterRows().length).toEqual(1);
					});

				});

			});

			describe("Selecting a string field", function () {

				beforeEach(function() {
					addAnother.click();
					row = container.find("ol").last();

					// Ensure that we are changing from a different value ui
					row.find("select.filterField option").filter(function() {
						    return $(this).text() == "Age"; 
						}).prop('selected', true);
						row.find("select.filterField").change();

					row.find("select.filterField option").filter(function() {
						    return $(this).text() == "First Name"; 
						}).prop('selected', true);
						row.find("select.filterField").change();
				});

				it("Should change the value input to a text field", function () {
					row = container.find("ol");
					expect(row.find("input.filterValue").attr("type")).toEqual("text");
				})

				it("Should only allow eq and ne and string function operators", function () {
					row = container.find("ol");
					var values = ko.utils.arrayMap(row.find("select.filterOperator option"), function (item) {
						return $(item).attr("value");
					})
					expect(values).toEqual(['eq', 'ne', 'startswith', 'endswith', 'contains']);
				})

			});

			describe("Selecting an int field", function () {

				beforeEach(function() {
					addAnother.click();
					row = container.find("ol").last();

					// Ensure that we are changing from a different value ui
					row.find("select.filterField option").filter(function() {
					    return $(this).text() == "Is Activated"; 
					}).prop('selected', true);
					row.find("select.filterField").change();

					row.find("select.filterField option").filter(function() {
					    return $(this).text() == "Age"; 
					}).prop('selected', true);				
					row.find("select.filterField").change();
				});

				it("Should change the value input to a number field", function () {
					row = container.find("ol");
					expect(row.find("input.filterValue").attr("type")).toEqual("number");
				})

				it("Should allow all comparison operators", function () {
					row = container.find("ol");
					var values = ko.utils.arrayMap(row.find("select.filterOperator option"), function (item) {
						return $(item).attr("value");
					})
					expect(values).toEqual([ 'eq', 'ne', 'gt', 'ge', 'lt', 'le' ]);
				})

			});

			describe("Selecting a bool field", function () {

				beforeEach(function() {
					addAnother.click();
					row = container.find("ol").last();

					// Ensure that we are changing from a different value ui
					row.find("select.filterField option").filter(function() {
					    return $(this).text() == "Age"; 
					}).prop('selected', true);
					row.find("select.filterField").change();

					row.find("select.filterField option").filter(function() {
					    return $(this).text() == "Is Activated"; 
					}).prop('selected', true);				
					row.find("select.filterField").change();
				});

				it("Should change the value field to a checkbox", function () {
					row = container.find("ol");
					expect(row.find("input.filterValue").attr("type")).toEqual("checkbox");
				})

				it("Should only allow eq and ne operators", function () {
					row = container.find("ol");
					var values = ko.utils.arrayMap(row.find("select.filterOperator option"), function (item) {
						return $(item).attr("value");
					})
					expect(values).toEqual(['eq', 'ne']);
				})

			});

			describe("Building the OData filter string", function () {

				describe("With default values", function () {

					beforeEach(function () {
						addAnother.click();
						row = container.find("ol").last(); 
					});

					it("Should handle undefined string values correctly",function ()
					{					
						row.find("select.filterField option").filter(function() {
						    return $(this).text() == "First Name"; 
						}).prop('selected', true);
						row.find("select.filterField").change();

						expect(model.getODataFilter()).toEqual("$filter=FirstName eq ''");
					});

					it("Should handle undefined int values correctly",function ()
					{					
						row.find("select.filterField option").filter(function() {
						    return $(this).text() == "Age"; 
						}).prop('selected', true);
						row.find("select.filterField").change();

						expect(model.getODataFilter()).toEqual("$filter=Age eq 0");
					});

					it("Should handle undefined bool values correctly",function ()
					{					
						row.find("select.filterField option").filter(function() {
						    return $(this).text() == "Is Activated"; 
						}).prop('selected', true);
						row.find("select.filterField").change();

						expect(model.getODataFilter()).toEqual("$filter=IsActivated eq false");
					});

				});

				describe("With no filters", function () {
	
					it("Should return an empty string",function ()
					{					
						expect(model.getODataFilter()).toEqual("");
					});

				});

				describe("With string fields", function () {

					describe("Comparison operators", function () {

						beforeEach(function() {
							addAnother.click();
							row = container.find("ol").last();
							
							row.find("select.filterField option").filter(function() {
							    return $(this).text() == "First Name"; 
							}).prop('selected', true);
							row.find("select.filterField").change();

							row.find("select.filterOperator").val("eq").change();
							row.find("input.filterValue").val("Pete").change();

							addAnother.click();
							row = container.find("ol").last();

							row.find("select.filterField option").filter(function() {
							    //may want to use $.trim in here
							    return $(this).text() == "Last Name"; 
							}).prop('selected', true);
							row.find("select.filterField").change();

							row.find("select.filterOperator").val("eq").change();
							row.find("input.filterValue").val("Smith").change();
						});

						it("Should construct the odata string, 'and'ing each filter",function ()
						{
							expect(model.getODataFilter()).toEqual("$filter=FirstName eq 'Pete' and LastName eq 'Smith'");
						});

					});

					describe("String functions", function () {

						beforeEach(function() {
							addAnother.click();
							row = container.find("ol").last();
							
							row.find("select.filterField option").filter(function() {
							    return $(this).text() == "First Name"; 
							}).prop('selected', true);
							row.find("select.filterField").change();
							row.find("input.filterValue").val("Pete").change();
						});

						it("Should construct the odata string correctlty with the startswith function",function ()
						{
							row.find("select.filterOperator").val("startswith").change();
							expect(model.getODataFilter()).toEqual("$filter=startswith(FirstName,'Pete')");
						});

						it("Should construct the odata string correctlty with the endswith function",function ()
						{
							row.find("select.filterOperator").val("endswith").change();
							expect(model.getODataFilter()).toEqual("$filter=endswith(FirstName,'Pete')");
						});

						it("Should construct the odata string correctlty with the substringof function",function ()
						{
							row.find("select.filterOperator").val("contains").change();
							expect(model.getODataFilter()).toEqual("$filter=substringof('Pete',FirstName)");
						});
					});

				});

				describe("With integer fields", function () {

					beforeEach(function() {
						addAnother.click();
						row = container.find("ol").last();

						row.find("select.filterField option").filter(function() {
						    return $(this).text() == "Age"; 
						}).prop('selected', true);
						row.find("select.filterField").change();

						row.find("select.filterOperator").val("eq").change();
						row.find("input.filterValue").val(16).change();
					});

					it("Should construct the odata string correctly",function ()
					{
						expect(model.getODataFilter()).toEqual("$filter=Age eq 16");
					});
					
				});

				describe("With bool fields", function () {

					beforeEach(function() {
						addAnother.click();
						row = container.find("ol").last();

						row.find("select.filterField option").filter(function() {
						    return $(this).text() == "Is Activated"; 
						}).prop('selected', true);
						row.find("select.filterField").change();		
									
						row.find("select.filterOperator").val("eq").change();
					});

					it("Should construct the odata string correctly for true values",function ()
					{
						// need to make sure the checkbox is in the opposite state, then clicking it will change and trigger knockout
						row.find("input.filterValue").prop('checked', false)
						row.find("input.filterValue").click();
						expect(model.getODataFilter()).toEqual("$filter=IsActivated eq true");
					});

					it("Should construct the odata string correctly for false values",function ()
					{
						// need to make sure the checkbox is in the opposite state, then clicking it will change and trigger knockout
						row.find("input.filterValue").prop('checked', true).change();
						row.find("input.filterValue").click();
						expect(model.getODataFilter()).toEqual("$filter=IsActivated eq false");
					});
					
				});

			});

		});

	});

});