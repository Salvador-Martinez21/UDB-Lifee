// calendar-combined.js
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // ---------- helpers ----------
    function pad(n) {
      return String(n).padStart(2, "0");
    }
    function isLeapYear(y) {
      return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    }
    function monthLengthsForYear(y) {
      return [
        31,
        isLeapYear(y) ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
      ];
    }
    function capitalizedMonthName(year, m, locale) {
      var raw = new Date(year, m, 1).toLocaleString(locale || "es-ES", {
        month: "long",
      });
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    // ---------- DOM refs ----------
    var calContainer = document.querySelector(".c-cal__container");
    var paginatorContainer = document.querySelector("#c-paginator");
    var prevBtn = document.querySelector("#prev");
    var nextBtn = document.querySelector("#next");

    if (!calContainer) {
      console.warn("No se encontró .c-cal__container en el DOM.");
      return;
    }
    if (!paginatorContainer) {
      console.warn("No se encontró #c-paginator en el DOM.");
      return;
    }

    // ---------- date / state ----------
    var dateObj = new Date();
    var currentMonth = dateObj.getMonth() + 1; // 1..12
    var currentDay = dateObj.getDate();
    var year = dateObj.getFullYear();
    var indexMonthVar = currentMonth; // 1..12 (carrusel index)
    var month = currentMonth;
    var day = currentDay;
    var today = year + "-" + pad(month) + "-" + pad(day);

    // ---------- month text (fallback) ----------
    var monthText = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    // ---------- build calendar DOM ----------
    function buildCalendar(y) {
      calContainer.innerHTML = "";
      var monthLengths = monthLengthsForYear(y);

      for (var m = 0; m < 12; m++) {
        var monthLen = monthLengths[m];
        var monthIndexStr = pad(m + 1);
        // nombre (localizado)
        var monthName = capitalizedMonthName(y, m, "es-ES");

        var firstDay = new Date(y, m, 1);
        var start_day = firstDay.getDay() + 1; // 1..7 (1=Dom)

        var mainDiv = document.createElement("div");
        mainDiv.className = "c-main c-main-" + monthIndexStr;
        mainDiv.setAttribute("data-month", monthIndexStr);

        // header row
        var headerRow = document.createElement("div");
        headerRow.className = "c-cal__row";
        ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"].forEach(function (d) {
          var col = document.createElement("div");
          col.className = "c-cal__col";
          col.textContent = d;
          headerRow.appendChild(col);
        });
        mainDiv.appendChild(headerRow);

        // first row (padding)
        var row = document.createElement("div");
        row.className = "c-cal__row";
        for (var i = 1; i < start_day; i++) {
          var emptyCel = document.createElement("div");
          emptyCel.className = "c-cal__cel";
          row.appendChild(emptyCel);
        }

        // fill first week
        var dayCounter = 1;
        for (var i = start_day; i < 8 && dayCounter <= monthLen; i++) {
          var cel = document.createElement("div");
          cel.className = "c-cal__cel";
          cel.setAttribute(
            "data-day",
            y + "-" + monthIndexStr + "-" + pad(dayCounter)
          );
          var p = document.createElement("p");
          p.textContent = dayCounter;
          cel.appendChild(p);
          row.appendChild(cel);
          dayCounter++;
        }
        mainDiv.appendChild(row);

        // remaining weeks
        while (dayCounter <= monthLen) {
          var weekRow = document.createElement("div");
          weekRow.className = "c-cal__row";
          for (var j = 1; j <= 7 && dayCounter <= monthLen; j++) {
            var cel2 = document.createElement("div");
            cel2.className = "c-cal__cel";
            cel2.setAttribute(
              "data-day",
              y + "-" + monthIndexStr + "-" + pad(dayCounter)
            );
            var p2 = document.createElement("p");
            p2.textContent = dayCounter;
            cel2.appendChild(p2);
            weekRow.appendChild(cel2);
            dayCounter++;
          }
          mainDiv.appendChild(weekRow);
        }

        calContainer.appendChild(mainDiv);
      }
    } // buildCalendar

    // ---------- build paginator items (solo actualiza label del mes) ----------
    function buildPaginator(y) {
      // Detectamos el mes actual
      var currentMonthIndex = new Date().getMonth(); // 0..11
      var currentMonthName = capitalizedMonthName(
        y,
        currentMonthIndex,
        "es-ES"
      );

      // Actualizamos el label del mes actual
      var monthLabel = document.getElementById("current-month");
      if (monthLabel) {
        monthLabel.textContent = currentMonthName.toUpperCase();
      }

      // Actualizamos también el año (por si cambia)
      var yearLabel = document.querySelector(".c-paginator__year");
      if (yearLabel) {
        yearLabel.textContent = y;
      }
    }

    // ---------- default events helper ----------
    function defaultEvents(dataDay, dataName, dataNotes, classTag) {
      var dateEl = $("*[data-day='" + dataDay + "']");
      if (!dateEl || dateEl.length === 0) return;
      dateEl.attr("data-name", dataName);
      dateEl.attr("data-notes", dataNotes);
      dateEl.addClass("event");
      dateEl.addClass("event--" + classTag);
    }

    // ---------- init ----------
    buildCalendar(year);
    buildPaginator(year);

    // jQuery refs (after building DOM)
    var monthEl = $(".c-main");
    var dataCel = $(".c-cal__cel");
    var todayBtn = $(".c-today__btn");
    var addBtn = $(".js-event__add");
    var saveBtn = $(".js-event__save");
    var closeBtn = $(".js-event__close");
    var winCreator = $(".js-event__creator");

    // default events (usa año actual)
    defaultEvents(today, "YEAH!", "Today is your day", "important");
    defaultEvents(
      year + "-12-25",
      "MERRY CHRISTMAS",
      "A lot of gift!!!!",
      "festivity"
    );
    defaultEvents(
      year + "-05-04",
      "LUCA'S BIRTHDAY",
      "Another gifts...?",
      "birthday"
    );
    defaultEvents(
      year + "-03-03",
      "MY LADY'S BIRTHDAY",
      "A lot of money to spent!!!!",
      "birthday"
    );

    // ---------- utility: fill aside ----------
    function fillEventSidebar(self) {
      $(".c-aside__event").remove();
      var thisName = self.attr("data-name");
      var thisNotes = self.attr("data-notes");
      var thisImportant = self.hasClass("event--important");
      var thisBirthday = self.hasClass("event--birthday");
      var thisFestivity = self.hasClass("event--festivity");
      var thisEvent = self.hasClass("event");

      switch (true) {
        case thisImportant:
          $(".c-aside__eventList").append(
            "<p class='c-aside__event c-aside__event--important'>" +
              thisName +
              " <span> • " +
              thisNotes +
              "</span></p>"
          );
          break;
        case thisBirthday:
          $(".c-aside__eventList").append(
            "<p class='c-aside__event c-aside__event--birthday'>" +
              thisName +
              " <span> • " +
              thisNotes +
              "</span></p>"
          );
          break;
        case thisFestivity:
          $(".c-aside__eventList").append(
            "<p class='c-aside__event c-aside__event--festivity'>" +
              thisName +
              " <span> • " +
              thisNotes +
              "</span></p>"
          );
          break;
        case thisEvent:
          $(".c-aside__eventList").append(
            "<p class='c-aside__event'>" +
              thisName +
              " <span> • " +
              thisNotes +
              "</span></p>"
          );
          break;
      }
    }

    // ---------- highlight today ----------
    dataCel.each(function () {
      if ($(this).data("day") === today) {
        $(this).addClass("isToday");
        fillEventSidebar($(this));
      }
    });

    // ---------- clicking cells ----------
    dataCel.on("click", function () {
      var thisEl = $(this);
      var dataDayAttr = $(this).attr("data-day") || "";
      var thisDay = dataDayAttr.slice(8);
      var thisMonth = dataDayAttr.slice(5, 7);

      fillEventSidebar($(this));
      $(".c-aside__num").text(thisDay);

      if (dataDayAttr) {
        var dtemp = new Date(dataDayAttr);
        var monthNameTemp = dtemp.toLocaleString("es-ES", { month: "long" });
        monthNameTemp =
          monthNameTemp.charAt(0).toUpperCase() + monthNameTemp.slice(1);
        $(".c-aside__month").text(monthNameTemp);
      } else {
        $(".c-aside__month").text("");
      }

      dataCel.removeClass("isSelected");
      thisEl.addClass("isSelected");
    });

    // ---------- event creator window ----------
    if (addBtn && addBtn.length) {
      addBtn.on("click", function () {
        winCreator.addClass("isVisible");
        $("body").addClass("overlay");
        var selected = dataCel.filter(".isSelected");
        if (selected && selected.length) {
          today = selected.first().data("day");
        } else {
          today = year + "-" + pad(month) + "-" + pad(day);
        }
        var inputDateEl = document.querySelector('input[type="date"]');
        if (inputDateEl) inputDateEl.value = today;
      });
    }
    if (closeBtn && closeBtn.length) {
      closeBtn.on("click", function () {
        winCreator.removeClass("isVisible");
        $("body").removeClass("overlay");
      });
    }
    if (saveBtn && saveBtn.length) {
      saveBtn.on("click", function () {
        var inputName = $("input[name=name]").val();
        var inputDateVal = $("input[name=date]").val();
        var inputNotes = $("textarea[name=notes]").val();
        var inputTag = $("select[name=tags]").find(":selected").text();

        dataCel.each(function () {
          if ($(this).data("day") === inputDateVal) {
            if (inputName != null) $(this).attr("data-name", inputName);
            if (inputNotes != null) $(this).attr("data-notes", inputNotes);
            $(this).addClass("event");
            if (inputTag != null) $(this).addClass("event--" + inputTag);
            fillEventSidebar($(this));
          }
        });

        winCreator.removeClass("isVisible");
        $("body").removeClass("overlay");
        var form = $("#addEvent");
        if (form && form[0]) form[0].reset();
      });
    }

    // ---------- movement (carousel) ----------
    function moveNext(steps, shouldUpdateIndex) {
      for (var i = 0; i < steps; i++) {
        $(".c-main").css({ left: "-=100%" });
        if (shouldUpdateIndex) indexMonthVar += 1;
      }
    }

    function movePrev(steps, shouldUpdateIndex) {
      for (var i = 0; i < steps; i++) {
        $(".c-main").css({ left: "+=100%" });
        if (shouldUpdateIndex) indexMonthVar -= 1;
      }
    }

    // ---------- paginator buttons ----------
    function buttonsPaginator(buttonId, mainClass, pagId, next, prev) {
      switch (true) {
        case next:
          $(buttonId).on("click", function () {
            if (indexMonthVar >= 2) {
              $(mainClass).css({ left: "+=100%" });
              indexMonthVar -= 1;
            }
            return indexMonthVar;
          });
          break;
        case prev:
          $(buttonId).on("click", function () {
            if (indexMonthVar <= 11) {
              $(mainClass).css({ left: "-=100%" });
              indexMonthVar += 1;
            }
            return indexMonthVar;
          });
          break;
      }
    }
    // attach; monthEl is jQuery collection of .c-main
    buttonsPaginator("#next", monthEl, "#c-paginator", false, true);
    buttonsPaginator("#prev", monthEl, "#c-paginator", true, false);

    // ---------- actualizar el label dinámicamente al moverse ----------
    function updateMonthLabel() {
      var months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];
      var label = document.getElementById("current-month");
      if (label) {
        var newMonthIndex = indexMonthVar - 1;
        if (newMonthIndex < 0) newMonthIndex = 0;
        if (newMonthIndex > 11) newMonthIndex = 11;
        label.textContent = months[newMonthIndex].toUpperCase();
      }
    }

    // cada vez que se mueve el carrusel, actualiza el label
    $("#next").on("click", updateMonthLabel);
    $("#prev").on("click", updateMonthLabel);
    $(".c-today__btn").on("click", updateMonthLabel);

    // ---------- "Este mes" button ----------
    if (todayBtn && todayBtn.length) {
      todayBtn.on("click", function () {
        if (month < indexMonthVar) {
          var step = indexMonthVar % month || 0;
          movePrev(step, true);
        } else if (month > indexMonthVar) {
          var step = month - indexMonthVar;
          moveNext(step, true);
        }
      });
    }

    // ---------- initial positioning ----------
    if (indexMonthVar > 1) {
      var stepsInit = indexMonthVar - 1;
      $(".c-main").css({ left: "-=" + 100 * stepsInit + "%" });
    }

    // ---------- fill aside current day ----------
    $(".c-aside__num").text(day);
    var localizedCurrentMonth = capitalizedMonthName(year, month - 1, "es-ES");
    $(".c-aside__month").text(localizedCurrentMonth);

    // ---------- expose state for debugging ----------
    window.calendarState = {
      year: year,
      today: today,
      month: month,
      day: day,
      indexMonth: indexMonthVar,
    };

    // ---------- quick diagnostics helper (opcional) ----------
    window._calendar_diag = function () {
      console.log(
        "#c-paginator children =",
        paginatorContainer.children.length
      );
      Array.from(paginatorContainer.children).forEach(function (ch, i) {
        console.log(i, "=>", JSON.stringify(ch.textContent));
      });
    };
  }); // DOMContentLoaded
})();
