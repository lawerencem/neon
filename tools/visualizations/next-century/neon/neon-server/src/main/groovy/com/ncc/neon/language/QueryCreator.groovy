package com.ncc.neon.language
import com.ncc.neon.language.parse.NeonBaseListener
import com.ncc.neon.language.parse.NeonParser
import com.ncc.neon.query.Query
import com.ncc.neon.query.clauses.*
import com.ncc.neon.query.filter.Filter
import org.apache.commons.lang.math.NumberUtils

/*
 * ************************************************************************
 * Copyright (c), 2013 Next Century Corporation. All Rights Reserved.
 *
 * This software code is the exclusive property of Next Century Corporation and is
 * protected by United States and International laws relating to the protection
 * of intellectual property.  Distribution of this software code by or to an
 * unauthorized party, or removal of any of these notices, is strictly
 * prohibited and punishable by law.
 *
 * UNLESS PROVIDED OTHERWISE IN A LICENSE AGREEMENT GOVERNING THE USE OF THIS
 * SOFTWARE, TO WHICH YOU ARE AN AUTHORIZED PARTY, THIS SOFTWARE CODE HAS BEEN
 * ACQUIRED BY YOU "AS IS" AND WITHOUT WARRANTY OF ANY KIND.  ANY USE BY YOU OF
 * THIS SOFTWARE CODE IS AT YOUR OWN RISK.  ALL WARRANTIES OF ANY KIND, EITHER
 * EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, ARE HEREBY EXPRESSLY
 * DISCLAIMED.
 *
 * PROPRIETARY AND CONFIDENTIAL TRADE SECRET MATERIAL NOT FOR DISCLOSURE OUTSIDE
 * OF NEXT CENTURY CORPORATION EXCEPT BY PRIOR WRITTEN PERMISSION AND WHEN
 * RECIPIENT IS UNDER OBLIGATION TO MAINTAIN SECRECY.
 *
 * 
 * @author tbrooks
 */

class QueryCreator extends NeonBaseListener{
    private final Map<String, WhereClause> parsedWhereClauses = [:]

    private String collectionName = ""
    private String databaseName = ""
    private WhereClause whereClause
    private final List<SortClause> sortClauses = []
    private final List<AggregateClause> aggregates = []
    private final List<GroupByClause> groupByClauses = []

    Query createQuery(){
        Query query = new Query()
        query.filter = new Filter(dataSourceName: databaseName, datasetId: collectionName)
        if (whereClause){
            query.filter.whereClause = whereClause
        }
        query.sortClauses = sortClauses
        query.aggregates = aggregates
        query.groupByClauses = groupByClauses
        query.limitClause = new LimitClause(limit: 20)
        return query
    }

    @Override
    public void exitDatabase(NeonParser.DatabaseContext ctx){
        databaseName = ctx.STRING()
    }

    @Override
    public void exitQuery(NeonParser.QueryContext ctx){
        collectionName = ctx.STRING()
    }

    @Override
    void exitWhereClause(NeonParser.WhereClauseContext ctx){
        if(ctx.AND()){
            createBooleanWhereClause(ctx, new AndWhereClause())
        }

        if(ctx.OR()){
            createBooleanWhereClause(ctx, new OrWhereClause())
        }

        if(parsedWhereClauses.size() == 1){
            whereClause = parsedWhereClauses.find().value
        }
    }

    @Override
    void exitSimpleWhereClause(NeonParser.SimpleWhereClauseContext ctx){
        parsedWhereClauses.put(ctx.text, singularWhereClause(ctx))
    }

    private SingularWhereClause singularWhereClause(NeonParser.SimpleWhereClauseContext whereContext){
        SingularWhereClause singularWhereClause = new SingularWhereClause()

        singularWhereClause.lhs = whereContext.STRING()[0].text
        singularWhereClause.operator = whereContext.operator().text
        singularWhereClause.rhs = whereContext.STRING()[1].text

        if(NumberUtils.isNumber(singularWhereClause.rhs)){
            singularWhereClause.rhs = Double.valueOf(singularWhereClause.rhs)
        }
        return singularWhereClause
    }

    private void createBooleanWhereClause(NeonParser.WhereClauseContext ctx, BooleanWhereClause booleanWhereClause){
        List<WhereClause> clauses = []
        ctx.whereClause().each{ NeonParser.WhereClauseContext context ->
            clauses << parsedWhereClauses.remove(escapeContextText(context.text))
        }
        booleanWhereClause.whereClauses = clauses
        parsedWhereClauses.put(escapeContextText(ctx.text), booleanWhereClause)
    }

    private static String escapeContextText(String text){
        if(text.startsWith("(") && text.endsWith(")")){
            return text[1..-2]
        }
        return text
    }

    @Override
    public void exitSortClause(NeonParser.SortClauseContext ctx) {
        SortClause sortClause = new SortClause(sortOrder: SortOrder.ASCENDING)
        sortClause.fieldName = ctx.STRING().text
        if(ctx.SORT_DIRECTION()){
            if(ctx.SORT_DIRECTION().text.toLowerCase() == "desc"){
                sortClause.sortOrder = SortOrder.DESCENDING
            }
        }
        sortClauses << sortClause
    }

    @Override
    void exitGroupClause(NeonParser.GroupClauseContext ctx){
        if(!ctx.STRING()){
            return
        }

        GroupByFieldClause fieldClause = new GroupByFieldClause()
        fieldClause.field = ctx.STRING().text
        groupByClauses << fieldClause
    }

    @Override
    void exitFunction(NeonParser.FunctionContext ctx){
        AggregateClause aggregateClause = new AggregateClause()
        aggregateClause.operation = ctx.functionName().text
        aggregateClause.field = ctx.STRING()
        aggregateClause.name = "${ctx.functionName().text}Of${ctx.STRING()}"

        aggregates << aggregateClause
    }
}