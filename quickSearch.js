loremWebApp.init = function () {
    $('html').removeClass('no-js');

    var defaults = {
        classes: {
            active: 'active',
            selected: 'active-js',
            hide: 'hide',
            noJs: 'no-js'
        },

        selectors: {
            input: 'input',
            textArea: 'textarea',
            navigation: '.sticky-js',
            loginRoot: '.n-16',
            staffRoot: '.n-17',
            staffItem: '.n-17__item',
            searchComponent: '.n-15',
            peopleFinder: '.n-19',

            gallery: {
                root: '.n-11',
                filter: '.n-11__filter',
                container: '.n-11__content',
                item: '.n-11__item',
                visible: '.n-11__content .n-11__item:visible'
            }
        },

        strings: {
            alternative: 'Lorem Ipsum'
        }
    };

    this.initSearch(defaults.selectors.searchComponent);
};

loremWebApp.BindSearchField = function (args) {

    var options = {
            selectors: {
                searchInput: args.input,
                modal: '#modal-1',
                body: 'body',
                results: args.root + '__search-results',
                searchResultItem: '.js-search-item',
                resultsLink: '.js-results-link',
                hint: '.tt-hint',
                suggestions: '.tt-suggestions',
                root: args.root
            },

            classes: {
                modalOpen: 'modal-open'
            },

            strings: {
                searchPlaceholder: 'search here'
            },

            booleans: {
                preventSearch: false
            },

            templates: args.templates,

            maxResults: 3,

            urlResults: args.urlResults,

            urlSuggestion: args.urlSuggestion,

            type: args.type
        },

        $root = $(options.selectors.root),
        $input = $(options.selectors.searchInput),
        $results = $(options.selectors.results),
        searchValue,

        output = _.template(options.templates.output),
        moreResultsLink = _.template(options.templates.moreResultsLink),
        noResults = _.template(options.templates.noResults);

    function getSearchResults(value) {
        $.ajax({
            type: "GET",
            cache: false,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            url: options.urlResults + value + '&start=0',
            success: getSearchResponse,
            error: function (xhr, ajaxOptions, thrownError) {
                console.error('search error ', arguments);
            }
        });

        searchValue = value;
    }

    function getSearchResponse(response) {
        emptyContent();
        window.scrollTo(0, 0);

        if (options.type === 'search') {
            renderSearchItems(response);
        } else if (options.type === 'finder') {
            renderPeopleFidnerItems(response);
        }
    }

    function linkAllResults() {

        if ($results.find(options.selectors.searchResultItem).length) {
            $results.after(
                moreResultsLink({
                    viewResults: $('#search-view-all-results-text').val(),
                    link: $('#search-page-url').val() + '/?query=' + encodeURI(searchValue)
                })
            );
        }
    }

    function displayNoResultsMsg() {
        $results.after(
            noResults({
                value: searchValue,
                noResults: renderNoResultsString($('#search-no-results-text').val())
            })
        );
    }

    function renderNoResultsString(input) {
        var string = input;
        return string.replace('{query}', searchValue.bold());
    }

    function setModalHeight() {
        if ($('.n-15__search-results').find('div').length === 0) {
            $('.modal-inner').css('min-height', $(document).height());
        } else {
            $('.modal-inner').attr('style', '');
        }
    }

    function renderSearchItems(response) {
        $.each(response, function (index) {
            if (index <= options.maxResults) {

                $results.append(
                    output({
                        title: this.Title,
                        link: this.Url,
                        copy: this.SummaryText
                    })
                );
            }
        });


        if (response.length === 0) {
            displayNoResultsMsg();
        } else {
            linkAllResults(response);
            setModalHeight();
        }
    }

};

loremWebApp.initSearch = function (el) {
    var $el = $(el);

    if ($el.length) {
        var searchField = new this.BindSearchField({
            input : '#my-input',
            root : '.n-15',
            urlSuggestion: '/api/Search/GetSearchSuggestions?lang=en&query=%QUERY',
            urlResults: '/api/Search/GetSearchResults?lang=en&query=',
            templates: {
                output:  '<div class="n-06__article js-search-item span__twelve">' +
                '<div class="container">' +
                '<a href="<%= link %>" class="no--style"> ' +
                '<h4><%= title %></h4> ' +
                '<p><%= copy %></p>' +
                '</a>' +
                '</div>' +
                '</div>',

                moreResultsLink : '<div class="n-06__article js-results-link span__twelve">' +
                '<div class="container">' +
                '<a href="<%= link %>" class="link__primary">' +
                '<span><%= viewResults %></span>' +
                '</a>' +
                '</div>' +
                '</div>',

                noResults : '<div class="n-06__article js-results-link span__twelve">' +
                '<div class="container">' +
                '<p><%= noResults %></p>' +
                '</div>' +
                '</div>'
            },
            type: 'search'
        });

        this.handleModalActions({
            input : '#my-input',
            root : '.n-15',
            modal: '#modal-1'
        })

        searchField.init();
    }
};

$(function () {
    loremWebApp.init();
});
